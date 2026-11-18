import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { allPaths, metadata, head, sitemap, robots } from '../src/seo.mjs';
import { features } from '../src/features.mjs';
import { site } from '../src/content.mjs';

test('indexable pages have complete, unique metadata within the specified limits', () => {
  const descriptions = new Set();
  for (const path of allPaths()) {
    const meta = metadata(path);
    if (meta.noindex) continue;
    assert.ok(meta.h1, path);
    assert.ok(meta.title.length <= 60, `${path}: title too long`);
    assert.ok(meta.description.length >= 120 && meta.description.length <= 155, `${path}: description ${meta.description.length}`);
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
    assert.doesNotMatch(html, /Дід[а]? Мороз|Санта|Санти|href="\/novyj-rik\//, path);
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
