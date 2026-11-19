import { build } from 'vite';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { brotliCompress, gzip, constants } from 'node:zlib';
import { promisify } from 'node:util';
import { allPaths, sitemap, robots } from '../src/seo.mjs';

await build();
await build({ build: { ssr: 'src/entry-server.js', outDir: '.server', emptyOutDir: true } });
const { render } = await import('../.server/entry-server.js');
const assets = await readdir('dist/assets');
const fontPreloads = assets.filter(f => /^rubik-(cyrillic|latin)-wght-normal-.*\.woff2$/.test(f)).map(f => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`).join('');
const template = (await readFile('dist/index.html', 'utf8')).replace('<!--page-head-->', fontPreloads + '<!--page-head-->');
for (const path of [...allPaths(), '/404/']) {
  const result = await render(path);
  const orderChunk = assets.find(f => /^OrderForm-.*\.js$/.test(f));
  const pageHead = result.head + (orderChunk && result.html.includes('id="product"') ? `<link rel="modulepreload" href="/assets/${orderChunk}">` : '');
  const directory = path === '/404/' ? resolve('dist') : resolve('dist', '.' + path);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, path === '/404/' ? '404.html' : 'index.html'), template.replace('<html lang="uk">', `<html lang="${result.lang}">`).replace('<!--page-head-->', pageHead).replace('<!--app-html-->', result.html));
}
await writeFile('dist/sitemap.xml', sitemap());
await writeFile('dist/robots.txt', robots());
// Precompress once at build time instead of spending CPU on every request.
const brotli = promisify(brotliCompress), gz = promisify(gzip);
async function compressTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await compressTree(file);
    else if (/\.(html|css|js|svg|xml|txt)$/.test(file)) {
      const body = await readFile(file);
      if (body.length < 512) continue;
      const [br, gzipBody] = await Promise.all([brotli(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }), gz(body, { level: 9 })]);
      await Promise.all([writeFile(file + '.br', br), writeFile(file + '.gz', gzipBody)]);
    }
  }
}
await compressTree('dist');
console.log(`Generated ${allPaths().length} Vue pages and 404.html in dist/.`);
