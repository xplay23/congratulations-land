import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { allPaths, metadata, head, sitemap, robots } from '../src/seo.mjs';
import { features } from '../src/features.mjs';
import { site, productCatalogue } from '../src/content.mjs';

const approvedSeo = [
  ['/', 'Відео привітання на замовлення з іменем | Videovitannya', 'Замовте відео привітання з іменем від Святого Миколая, Діда Мороза чи Санта Клауса. Перегляд до оплати.', 'Відео привітання на замовлення з іменем'],
  ['/svyatyj-mykolaj/', 'Відео привітання від Святого Миколая | Videovitannya', 'Святий Миколай привітає дитину чи дорослого по імені. Персональне відео з вашими побажаннями, готове швидко. Перегляд до оплати, оплата онлайн.', 'Відео привітання від Святого Миколая для дітей і дорослих'],
  ['/novyj-rik/', 'Відео привітання від Діда Мороза з іменем | Videovitannya', 'Оберіть Діда Мороза або Санта Клауса: новорічне відео з привітанням по імені для дитини чи дорослого. Перегляд до оплати, швидке виконання.', 'Відео привітання з Новим роком від Діда Мороза або Санта Клауса'],
  ['/pisnya-na-zamovlennya/', 'Пісня на замовлення з іменем: створити пісню', "Іменна пісня на замовлення: вкажіть ім'я та побажання, і отримайте пісню з вашим текстом. Подарунок на день народження, Новий рік чи ювілей.", 'Іменна пісня на замовлення'],
  ['/ozhyvyty-foto/', 'Оживити фото онлайн: старе фото у відео | Videovitannya', 'Оживіть старе фото онлайн: людина на знімку усміхнеться, моргне й поверне голову. Завантажте фото й перегляньте результат до оплати.', 'Оживити фото онлайн']
];

test('approved SEO copy is exact in metadata, social tags and prerendered headings', async () => {
  for (const [path, title, description, h1] of approvedSeo) {
    const hidden = path === '/novyj-rik/' && !features.santaVisible;
    const meta = hidden ? productCatalogue.find(p => p.id === 'newyear') : metadata(path);
    assert.deepEqual([meta.title, meta.description, meta.h1], [title, description, h1], path);
    if (hidden) continue;
    const html = await readFile(`dist${path}index.html`, 'utf8');
    const escapedDescription = description.replaceAll("'", '&#39;');
    assert.ok(html.includes(`<title>${title}</title>`), path);
    assert.ok(html.includes(`<meta name="description" content="${escapedDescription}">`), path);
    assert.ok(html.includes(`<meta property="og:title" content="${title}">`), path);
    assert.ok(html.includes(`<meta property="og:description" content="${escapedDescription}">`), path);
    assert.equal(html.match(/<h1[^>]*>(.*?)<\/h1>/s)[1], h1, path);
  }
  const mykolay = await readFile('dist/svyatyj-mykolaj/index.html', 'utf8');
  for (const title of ['Як замовити відео від Миколая', 'Для дитини', 'Для дорослих', 'Скільки коштує', 'Питання й відповіді']) {
    assert.ok(mykolay.includes(`<h2>${title}</h2>`), title);
  }
});

test('indexable pages have complete, unique metadata within the specified limits', () => {
  const descriptions = new Set();
  for (const path of allPaths()) {
    const meta = metadata(path);
    if (meta.noindex) continue;
    assert.ok(meta.h1, path);
    assert.ok(meta.title.length <= 60, `${path}: title too long`);
    assert.ok(meta.description.length >= 90 && meta.description.length <= 155, `${path}: description ${meta.description.length}`);
    assert.ok(!descriptions.has(meta.description), `${path}: duplicate description`);
    descriptions.add(meta.description);
    assert.ok(head(path).includes(`href="${site.url}${path}"`));
  }
});

test('sitemap excludes service paths, empty hubs and the future cartoon product', () => {
  const xml = sitemap();
  for (const path of allPaths()) assert.equal(xml.includes(`<loc>${site.url}${path}</loc>`), features.indexingEnabled && !metadata(path).noindex, path);
  assert.ok(head('/novyj-rik/', true).includes('noindex, nofollow'));
  assert.ok(head('/multfilm-pro-dytynu/').includes(features.indexingEnabled ? 'noindex, follow' : 'noindex, nofollow'));
  assert.ok(head('/kabinet/').includes('noindex, nofollow'));
});

test('temporary settings remove Santa and keep every page out of search', async () => {
  assert.equal(features.indexingEnabled, false);
  assert.equal(features.santaVisible, false);
  assert.equal(metadata('/novyj-rik/').status, 404);
  assert.ok(!allPaths().includes('/novyj-rik/'));
  assert.ok(!sitemap().includes('<loc>'));
  assert.ok(!robots().includes('Sitemap:'));
  assert.ok(!robots().includes('Disallow: /\n'));
  for (const path of allPaths()) {
    const html = await readFile(`dist${path}index.html`, 'utf8');
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'), path);
    // The approved home meta description mentions these heroes; their UI remains hidden.
    const body = html.match(/<body[^>]*>(.*?)<\/body>/s)[1];
    assert.doesNotMatch(body, /Дід[а]? Мороз|Санта|Санти|href="\/novyj-rik\//, path);
  }
});

test('generated Vue HTML has one H1, static content, valid JSON-LD and local image assets', async () => {
  const known = new Set(allPaths());
  for (const path of allPaths()) {
    const html = await readFile(`dist${path}index.html`, 'utf8');
    assert.equal([...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length, 1, path);
    assert.ok(html.includes('<html lang="uk">'), path);
    assert.ok(!html.includes('<!--app-html-->'), path);
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (match) {
      const schema = JSON.parse(match[1]);
      assert.ok(!JSON.stringify(schema).match(/AggregateRating|"@type":"Review"/), path);
    }
    for (const image of html.matchAll(/(?:src|content)="(?:https:\/\/videovitannya\.com\.ua)?(\/assets\/[^"?]+\.(?:webp|png|jpg))"/g)) await access(`dist${image[1]}`);
    for (const link of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      if (link[1].startsWith('/assets/')) continue;
      assert.ok(known.has(link[1]), `${path}: broken link ${link[1]}`);
    }
  }
});
