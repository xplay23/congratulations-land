import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { products, prices } from '../src/content.mjs';
import { occasions, giftFormats } from '../src/birthday.mjs';

const bankApi = 'https://api.monobank.ua/api/merchant/invoice/';
const checkoutOrigins = new Set(['https://pay.monobank.ua', 'https://pay.mbnk.biz']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const statuses = new Set(['created', 'processing', 'hold', 'success', 'failure', 'expired', 'reversed']);

class PaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function quote({ product, variant, children, occasion }) {
  const item = products.find(p => p.id === product && p.price !== null);
  const format = giftFormats.find(gift => gift.id === variant);
  const birthdayOrder = product === 'birthday';
  if (birthdayOrder && occasion === undefined) occasion = 'birthday';
  if (!item || (birthdayOrder ? !format || typeof occasion !== 'string' || !Object.hasOwn(occasions, occasion) : variant !== undefined || occasion !== undefined)
    || (product === 'newyear' ? !['1', '2'].includes(children) : children !== undefined)) {
    throw new PaymentError(400, 'Перевірте вибраний подарунок.');
  }
  const amount = product === 'birthday' ? prices[variant] : children === '2' ? prices.winterTwo : item.price;
  return {
    selection: [product, variant, children].join('/') + (birthdayOrder && occasion !== 'birthday' ? '/' + occasion : ''),
    ...(birthdayOrder && { occasion }),
    amount: amount * 100,
    label: birthdayOrder ? format.uk + ' · ' + occasions[occasion].uk : [item.label, children === '2' ? 'Для двох дітей' : ''].filter(Boolean).join(' · ')
  };
}

async function readInput(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new PaymentError(415, 'Потрібен запит у форматі JSON.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2048) throw new PaymentError(413, 'Завеликий запит.');
    chunks.push(chunk);
  }
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    if (typeof input?.orderId === 'string' && uuid.test(input.orderId)) return input;
  } catch {}
  throw new PaymentError(400, 'Некоректне замовлення.');
}

export function createPlataTest({ token, origin, directory, fetchBank = fetch }) {
  // One web process owns the checkout directory in the VPS Compose deployment.
  const creating = new Map();
  let windowEnds = 0, invoicesInWindow = 0;
  async function bank(path, body) {
    const response = await fetchBank(bankApi + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'X-Token': token, ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body), signal: AbortSignal.timeout(12000), redirect: 'error'
    });
    if (!response.ok) throw new PaymentError(502, 'Банк тимчасово не відповідає. Спробуйте ще раз.');
    return response.json();
  }
  async function lookup(id) {
    try { return JSON.parse(await readFile(join(directory, id + '.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
  }
  async function create(orderId, gift) {
    const existing = await lookup(orderId);
    if (existing) return existing;
    if (Date.now() >= windowEnds) {
      windowEnds = Date.now() + 60000;
      invoicesInWindow = 0;
    }
    if (invoicesInWindow >= 30) throw new PaymentError(429, 'Забагато тестових рахунків. Спробуйте за хвилину.');
    invoicesInWindow++;
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const invoice = await bank('create', {
      amount: gift.amount, ccy: 980, validity: 3600,
      merchantPaymInfo: { reference: orderId, destination: 'Тестова оплата · ' + gift.label },
      redirectUrl: origin + '/oplata/#' + orderId
    });
    const checkoutUrl = new URL(invoice.pageUrl);
    if (typeof invoice.invoiceId !== 'string' || !invoice.invoiceId
      || !checkoutOrigins.has(checkoutUrl.origin) || checkoutUrl.username || checkoutUrl.password) {
      throw new Error('Invalid invoice');
    }
    const record = { ...gift, invoiceId: invoice.invoiceId, pageUrl: invoice.pageUrl };
    const file = join(directory, orderId + '.json');
    const temporary = file + '.' + randomUUID() + '.tmp';
    await writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
    await rename(temporary, file);
    return record;
  }
  return async function handle(req, res, path) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    function send(status, body) { res.writeHead(status); res.end(JSON.stringify(body)); }
    try {
      if (path === '/api/plata/config' && req.method === 'GET') {
        return send(200, { testAvailable: Boolean(token) });
      }
      if (!token) throw new PaymentError(503, 'Тестова оплата ще не налаштована.');
      if (path === '/api/plata/invoices' && req.method === 'POST') {
        if (req.headers.origin && req.headers.origin !== origin) throw new PaymentError(403, 'Невідоме джерело запиту.');
        const input = await readInput(req);
        const gift = quote(input);
        const { orderId } = input;
        if (!creating.has(orderId)) {
          creating.set(orderId, create(orderId, gift).finally(() => creating.delete(orderId)));
        }
        const invoice = await creating.get(orderId);
        if (invoice.selection !== gift.selection) throw new PaymentError(409, 'Для цього замовлення вже обрано інший подарунок.');
        return send(200, { pageUrl: invoice.pageUrl });
      }
      const id = path.slice('/api/plata/invoices/'.length);
      if (path.startsWith('/api/plata/invoices/') && uuid.test(id) && req.method === 'GET') {
        const invoice = await lookup(id);
        if (!invoice) throw new PaymentError(404, 'Тестовий рахунок не знайдено.');
        const state = await bank('status?invoiceId=' + encodeURIComponent(invoice.invoiceId));
        if (state.invoiceId !== invoice.invoiceId || state.reference !== id || state.amount !== invoice.amount
          || state.ccy !== 980 || !statuses.has(state.status)
          || (state.status === 'success' && state.finalAmount != null && state.finalAmount !== invoice.amount)) {
          throw new PaymentError(502, 'Не вдалося підтвердити дані рахунку.');
        }
        return send(200, { status: state.status, amount: invoice.amount, label: invoice.label,
          ...(state.status === 'created' && { pageUrl: invoice.pageUrl }) });
      }
      send(404, { error: 'Рахунок не знайдено.' });
    } catch (error) {
      send(error instanceof PaymentError ? error.status : 502, {
        error: error instanceof PaymentError ? error.message : 'Не вдалося зв’язатися з платіжним сервісом. Спробуйте ще раз.'
      });
    }
  };
}
