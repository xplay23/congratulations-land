import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPlataTest } from '../lib/plata-test.mjs';

async function checkout(t, token = 'test-fixture') {
  const directory = await mkdtemp(join(tmpdir(), 'plata-test-'));
  const invoices = [];
  let state = {};
  const fetchBank = async (url, options) => {
    assert.equal(options.headers['X-Token'], 'test-fixture');
    if (url === 'https://api.monobank.ua/api/merchant/invoice/create') {
      const request = JSON.parse(options.body);
      invoices.push(request);
      const invoiceId = 'invoice-' + invoices.length;
      return Response.json({ invoiceId, pageUrl: 'https://pay.mbnk.biz/' + invoiceId });
    }
    assert.equal(url, 'https://api.monobank.ua/api/merchant/invoice/status?invoiceId=invoice-1');
    const { amount, ccy, merchantPaymInfo } = invoices[0];
    return Response.json({ invoiceId: 'invoice-1', reference: merchantPaymInfo.reference, amount, ccy,
      status: 'created', paymentInfo: { maskedPan: 'private' }, ...state });
  };
  const options = { token, directory, origin: 'https://videovitannya.com.ua', fetchBank };
  let handle = createPlataTest(options);
  const server = createServer((req, res) => handle(req, res, new URL(req.url, options.origin).pathname));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const url = 'http://127.0.0.1:' + server.address().port + '/api/plata/';
  return { invoices, restart: () => { handle = createPlataTest(options); },
    status: body => { state = body; },
    get: path => fetch(url + path),
    post: (body, origin = options.origin) => fetch(url + 'invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body)
    }) };
}

test('missing test credentials disable checkout before contacting the bank', async t => {
  const api = await checkout(t, '');
  assert.deepEqual(await (await api.get('config')).json(), { testAvailable: false });
  assert.equal((await api.post({ product: 'photo', orderId: randomUUID() })).status, 503);
  assert.equal(api.invoices.length, 0);
});

test('catalogue prices and eligible gifts are enforced on the server', async t => {
  const api = await checkout(t);
  for (const [selection, expected] of [
    [{ product: 'photo' }, 19900], [{ product: 'song' }, 39900], [{ product: 'mykolay' }, 39900],
    [{ product: 'birthday', variant: 'birthday' }, 54900], [{ product: 'birthday', variant: 'photo' }, 19900],
    [{ product: 'birthday', variant: 'song' }, 39900]
  ]) {
    const orderId = randomUUID();
    const response = await api.post({ ...selection, orderId, amount: 1, ccy: 840, email: 'private@example.test' });
    assert.equal(response.status, 200);
    const request = api.invoices.at(-1);
    assert.equal(request.amount, expected);
    assert.equal(request.ccy, 980);
    assert.equal(request.redirectUrl, 'https://videovitannya.com.ua/oplata/#' + orderId);
    assert.doesNotMatch(JSON.stringify(request), /private@example/);
  }
  for (const selection of [{ product: 'newyear' }, { product: 'mykolay', children: '2' }, { product: 'birthday', variant: 'free' }]) {
    assert.equal((await api.post({ ...selection, orderId: randomUUID() })).status, 400);
  }
  assert.equal((await api.post({ product: 'photo', orderId: randomUUID() }, 'https://other.example')).status, 403);
  assert.equal(api.invoices.length, 6);
});

test('repeat submissions share an invoice and the result is verified with mono after a restart', async t => {
  const api = await checkout(t);
  const orderId = randomUUID(), gift = { orderId, product: 'photo' };
  const responses = await Promise.all([api.post(gift), api.post(gift)]);
  assert.deepEqual(await responses[0].json(), await responses[1].json());
  api.restart();
  assert.equal((await api.post(gift)).status, 200);
  assert.equal((await api.post({ orderId, product: 'song' })).status, 409);
  assert.equal(api.invoices.length, 1);
  const path = 'invoices/' + orderId;
  for (const status of ['created', 'processing', 'success', 'failure', 'reversed', 'expired']) {
    api.status({ status });
    const result = await (await api.get(path + '?status=success')).json();
    assert.equal(result.status, status);
    assert.equal(result.amount, 19900);
    assert.equal(Boolean(result.pageUrl), status === 'created');
    assert.equal(result.paymentInfo, undefined);
  }
  for (const invalid of [{ ccy: 840 }, { amount: 1 }, { reference: randomUUID() }, { invoiceId: 'wrong' }, { finalAmount: 1 }]) {
    api.status({ status: 'success', ...invalid });
    assert.equal((await api.get(path)).status, 502);
  }
  assert.equal((await api.get('invoices/' + randomUUID())).status, 404);
});

test('birthday format and occasion survive checkout and a retry', async t => {
  const api = await checkout(t);
  const order = { orderId: randomUUID(), product: 'birthday', variant: 'birthday', occasion: 'jubilee' };
  assert.equal((await api.post(order)).status, 200);
  assert.equal(api.invoices[0].amount, 54900);
  assert.match(api.invoices[0].merchantPaymInfo.destination, /Пісня \+ кліп з живим фото · Ювілей/);
  api.restart();
  assert.equal((await api.post(order)).status, 200);
  assert.equal((await api.post({ ...order, occasion: 'other' })).status, 409);
  assert.equal((await api.post({ ...order, occasion: 'unlisted' })).status, 400);
  assert.equal(api.invoices.length, 1);
});
