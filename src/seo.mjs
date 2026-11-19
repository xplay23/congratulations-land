import { birthdayContent, birthdayPaths } from './birthday.mjs';
import { products, home, hubs, articles, site, prices, articlePath, productPath } from './content.mjs';
import { features } from './features.mjs';

export const homeFaq = [
  ['Як замовити відео привітання з іменем?', "Оберіть привітання, вкажіть ім'я та кілька слів про людину, перевірте дані й оплатіть замовлення. Відео приходить на вашу пошту."],
  ['Скільки готується відео привітання?', 'Приблизно 5 хвилин після оплати. Готове відео надсилається на пошту, яку ви вказали в замовленні.'],
  ['Скільки коштує відео привітання від Святого Миколая?', `Від ${prices.winter} грн. Точну ціну ви бачите перед оплатою, а повний перелік на сторінці «Ціни».`],
  ['Чи безпечно завантажувати фото?', 'Фото використовується лише для вашого замовлення. Докладніше в політиці конфіденційності.']
];
export const priceFaq = [
  ['Чи є підписка?', 'Ні, оплата разова за кожне замовлення.'],
  ['Чи можна повернути гроші?', 'Умови повернення будуть опубліковані в затвердженій оферті до початку приймання оплат.'],
  ['Як оплатити?', 'Після перевірки даних у формі замовлення можна випробувати оплату карткою через plata by mono. У тестовому режимі кошти не списуються.']
];
export const servicePages = {
  'pro-nas': { title: 'Про сервіс персональних вітань', h1: 'Про сервіс', description: 'Videovitannya — персональні відео та пісні українською. Дізнайтеся, як ми перетворюємо ваші слова й спогади на подарунок для близьких.', sections: [
    ['', 'Ми створюємо сервіс персональних відеопривітань українською — з іменем, вашою історією та увагою до деталей.'],
    ['Особисте звертання', 'Вкажіть ім’я так, як ви звертаєтеся до людини вдома. Додайте спільний спогад або побажання, яке вона впізнає.'],
    ['Технології з людським задумом', 'Для створення відео й пісень плануємо використовувати штучний інтелект. Історію, побажання та найважливіші деталі додаєте ви. Сервіс у розробці. Генерацію та приймання оплат ще не відкрито.']
  ] },
  kontakty: { title: 'Контакти та підтримка', h1: 'Контакти', description: 'Контакти й підтримка Videovitannya. Інформація про доступність сервісу, майбутні замовлення та канали зв’язку з командою.', sections: [
    ['', 'Готуємо сервіс до запуску. Канал підтримки та реквізити продавця будуть опубліковані до початку приймання замовлень.'],
    ['Що доступно зараз', 'Форма працює як демонстрація: ви можете обрати подарунок і перевірити дані замовлення, без надсилання особистих даних.']
  ] },
  oferta: { title: 'Публічна оферта', h1: 'Публічна оферта', description: 'Інформація про підготовку публічної оферти Videovitannya: умови цифрових замовлень, оплати й повернення будуть доступні до запуску.', sections: [
    ['Документ готується', 'Оферту та реквізити продавця має затвердити власник сервісу разом із юристом перед початком приймання оплат.'],
    ['', 'Поки документ не опубліковано й еквайринг не підключено, оформлення платного замовлення недоступне.']
  ] },
  konfidentsiynist: { title: 'Політика конфіденційності', h1: 'Політика конфіденційності', description: 'Як працює демонстраційна форма Videovitannya та що відбувається з вашими даними. Правила обробки фото й контактів перед запуском сервісу.', sections: [
    ['Поточний режим: демонстрація', 'Ім’я, контакти, побажання та фото залишаються у пам’яті браузера. Для тестової оплати сайт зберігає вибір подарунка, суму й дані рахунку. Банк отримує номер замовлення, назву подарунка та суму. Після оновлення сторінки форму буде очищено.'],
    ['Cookies та аналітика', 'До закриття вкладки браузер зберігає номер останнього тестового замовлення, щоб ви могли перевірити платіж після повернення з банку. Вибір щодо аналітики зберігається у localStorage браузера. Аналітичні й рекламні системи наразі не підключені. Змінити вибір можна кнопкою внизу сторінки.'],
    ['Правила після запуску', 'Перед запуском опублікуємо затверджену політику з даними оператора, переліком провайдерів генерації, строками зберігання, порядком видалення та контактами для звернень. Справжні фото до цього моменту завантажувати не потрібно.']
  ] }
};

export function metadata(path) {
  if (path === '/') return { ...home, kind: 'home', faq: homeFaq };
  if (path === birthdayPaths.ru) {
    const product = { ...products.find(p => p.id === 'birthday'), ...birthdayContent('ru', prices) };
    return { ...product, product, kind: 'product' };
  }
  const product = products.find(p => productPath(p) === path);
  if (product) return { ...product, product, kind: 'product' };
  if (path === '/tsiny/') return { kind: 'prices', title: 'Ціни на відео привітання, пісні й оживлення фото', description: 'Ціни на відео привітання від Святого Миколая, оживлення фото та пісню на замовлення. Разова оплата за обраний подарунок без підписки.', h1: 'Ціни на відео привітання, пісні та оживлення фото', faq: priceFaq };
  const service = servicePages[path.split('/')[1]];
  if (service && path === `/${path.split('/')[1]}/`) return { ...service, kind: 'document' };
  const hub = hubs.find(h => path === `/blog/${h.slug}/`);
  if (hub || path === '/blog/') return { kind: 'blog', hub, title: hub?.title || 'Блог про привітання: ідеї, тексти, відео', h1: hub?.h1 || 'Блог про привітання', description: hub?.description || 'Ідеї для особистих привітань, авторські тексти та поради для подарунків. Знайдіть слова для близьких і підготуйте власне тепле привітання.', noindex: hub ? articles.filter(a => a.hub === hub.slug).length < 3 || hub.slug === 'kazky-multfilmy' : false };
  const article = articles.find(a => articlePath(a) === path);
  if (article) return { ...article, article, h1: article.title, kind: 'article' };
  if (path === '/zamovlennya/') return { kind: 'order', title: 'Замовлення', h1: 'Ваш особистий подарунок', description: 'Персоналізуйте привітання та перевірте дані замовлення.', noindex: true, nofollow: true };
  if (path === '/oplata/') return { kind: 'payment', title: 'Тестова оплата', h1: 'Тестова оплата', description: 'Стан тестового платежу через plata by mono.', noindex: true, nofollow: true };
  const title = { '/kabinet/': 'Мої замовлення', '/rezultat/': 'Ваше привітання' }[path];
  if (title) return { kind: 'unavailable', title, h1: title, description: 'Особистий розділ сервісу персональних відеопривітань Videovitannya.', noindex: true, nofollow: true };
  return { kind: '404', status: 404, title: 'Сторінку не знайдено', h1: 'Сторінку не знайдено', description: 'Такої сторінки немає. Поверніться на головну й оберіть персональне привітання.', noindex: true, nofollow: true };
}

export function allPaths() {
  return ['/', ...products.map(productPath), birthdayPaths.ru, '/tsiny/', ...Object.keys(servicePages).map(s => `/${s}/`), '/blog/', ...hubs.map(h => `/blog/${h.slug}/`), ...articles.map(articlePath), '/zamovlennya/', '/kabinet/', '/oplata/', '/rezultat/'];
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function head(path, hasQuery = false) {
  const meta = metadata(path);
  const title = meta.appendBrand !== false && !meta.title.endsWith(' | Videovitannya') && meta.title.length + 16 <= 60 ? `${meta.title} | Videovitannya` : meta.title;
  const org = { '@type': 'Organization', '@id': site.url + '/#organization', name: site.name, url: site.url, logo: site.url + '/assets/video-gift.svg' };
  const graph = [];
  if (meta.kind === 'home') graph.push(org, { '@type': 'WebSite', name: site.name, url: site.url });
  if (meta.id === 'birthday') graph.push({ '@type': 'Service', name: meta.serviceName, description: meta.description, provider: org,
    areaServed: { '@type': 'Country', name: 'UA' }, offers: { '@type': 'Offer', price: prices.birthday, priceCurrency: 'UAH', url: site.url + path } });
  else if (meta.kind === 'product') graph.push({ '@type': 'Service', name: meta.h1, description: meta.description, provider: org, areaServed: { '@type': 'Country', name: 'UA' }, ...(meta.price !== null ? { offers: { '@type': 'AggregateOffer', lowPrice: meta.price, highPrice: meta.id === 'newyear' ? prices.winterTwo : meta.price, priceCurrency: 'UAH', offerCount: meta.id === 'newyear' ? 2 : 1 } } : {}) });
  if (meta.kind === 'prices') graph.push({ '@type': 'ItemList', itemListElement: products.filter(p => p.price !== null).map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Service', name: p.label, url: site.url + productPath(p), offers: { '@type': 'Offer', price: p.price, priceCurrency: 'UAH' } } })) });
  if (meta.kind === 'article') graph.push({ '@type': 'Article', headline: meta.title, image: `${site.url}/assets/og-christmas-mykolay.jpg`, datePublished: site.modified, dateModified: site.modified, author: { '@type': 'Organization', name: 'Редакція Videovitannya', url: site.url + '/pro-nas/' }, publisher: org, mainEntityOfPage: site.url + path });
  if (meta.faq) graph.push({ '@type': 'FAQPage', mainEntity: meta.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  if (path !== '/' && !meta.status) {
    const crumbs = [{ name: meta.lang === 'ru' ? 'Главная' : 'Головна', url: '/' }];
    if (path.startsWith('/blog/') && path !== '/blog/') crumbs.push({ name: 'Блог', url: '/blog/' });
    if (meta.article) crumbs.push({ name: hubs.find(h => h.slug === meta.article.hub).label, url: `/blog/${meta.article.hub}/` });
    crumbs.push({ name: meta.id === 'birthday' ? meta.label : meta.h1, url: path });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: site.url + c.url })) });
  }
  const alternates = meta.id === 'birthday' ? Object.entries({ ...birthdayPaths, 'x-default': birthdayPaths.uk })
    .map(([lang, url]) => `<link rel="alternate" hreflang="${lang}" href="${site.url}${url}">`).join('') : '';
  const ogTitle = meta.id === 'birthday' ? meta.title + ' | Videovitannya' : title;
  const og = meta.id === 'birthday' ? site.url + '/assets/og-birthday-music.jpg' : `${site.url}/assets/og-christmas-${meta.product?.id || 'home'}.jpg`;
  return `<title>${escape(title)}</title><meta name="description" content="${escape(meta.description)}"><meta name="robots" content="${!features.indexingEnabled || meta.noindex || hasQuery ? 'noindex' : 'index'}, ${!features.indexingEnabled || meta.nofollow || hasQuery ? 'nofollow' : 'follow'}"><link rel="canonical" href="${site.url}${escape(path)}">${alternates}<meta property="og:title" content="${escape(ogTitle)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:url" content="${site.url}${escape(path)}"><meta property="og:type" content="${meta.article ? 'article' : 'website'}"><meta property="og:locale" content="${meta.lang === 'ru' ? 'ru_UA' : 'uk_UA'}"><meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">${graph.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>` : ''}`;
}

export function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allPaths().filter(p => features.indexingEnabled && !metadata(p).noindex).map(p => `<url><loc>${site.url}${p}</loc><lastmod>${site.modified}</lastmod></url>`).join('')}</urlset>`;
}

export function robots() {
  // Crawlers must reach the pages to see noindex; Disallow: / would hide it.
  return 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\n' + (features.indexingEnabled
    ? `Sitemap: ${site.url}/sitemap.xml\n`
    : '# Indexing is temporarily disabled using noindex meta tags and X-Robots-Tag.\n# Crawling stays allowed so search engines can read the noindex directive.\n');
}
