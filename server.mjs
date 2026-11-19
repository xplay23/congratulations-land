import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parseEnv } from 'node:util';
import { createPlataTest } from './lib/plata-test.mjs';
import { serveVideo } from './lib/serve-video.mjs';
import { sitemap, robots } from './src/seo.mjs';
import { features } from './src/features.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const production = process.argv.includes('--production');
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
let testToken = process.env.MONO_TEST_TOKEN;
if (!testToken) {
  try { testToken = parseEnv(await readFile(resolve(root, '.env.mono-test'), 'utf8')).MONO_TEST_TOKEN; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const paymentOrigin = new URL(process.env.MONO_SITE_ORIGIN || `http://${host}:${port}`).origin;
const handlePayment = createPlataTest({
  token: testToken?.trim(), origin: paymentOrigin,
  directory: process.env.MONO_TEST_DATA_DIR || resolve(tmpdir(), 'videovitannya-plata-test')
});
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
const vite = production ? null : await (await import('vite')).createServer({ root, appType: 'custom', server: { middlewareMode: true } });

const server = http.createServer(async (req, res) => {
  if (!features.indexingEnabled) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end('Bad request'); return; }
    if (path.includes('\\') || path.includes('\0') || path.split('/').some(p => p === '..') || path.startsWith('/.')) { res.writeHead(404); res.end('Not found'); return; }
    if (path.startsWith('/api/plata/')) { await handlePayment(req, res, path); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end('Method not allowed'); return; }
    // These canonical domain redirects are enabled only behind a trusted TLS proxy.
    if (process.env.TRUST_PROXY === 'true' && (req.headers.host === 'www.videovitannya.com.ua' || req.headers['x-forwarded-proto'] === 'http')) {
      res.writeHead(301, { Location: `https://videovitannya.com.ua${url.pathname}${url.search}` }); res.end(); return;
    }
    const viteInternal = vite && (path.startsWith('/@') || path.startsWith('/node_modules/') || path.startsWith('/src/'));
    if (!viteInternal && !extname(path) && path !== path.toLowerCase()) { res.writeHead(301, { Location: path.toLowerCase() + (path.endsWith('/') ? '' : '/') + url.search }); res.end(); return; }
    if (!viteInternal && !extname(path) && !path.endsWith('/')) { res.writeHead(301, { Location: path + '/' + url.search }); res.end(); return; }
    if (!production && (path === '/sitemap.xml' || path === '/robots.txt')) {
      res.writeHead(200, { 'Content-Type': contentTypes[extname(path)], 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : path === '/robots.txt' ? robots() : sitemap()); return;
    }
    if (vite && (extname(path) || path.startsWith('/@') || path.startsWith('/node_modules/') || path.startsWith('/src/'))) {
      // Vite's own paths are needed by the dev client. Dotfiles elsewhere remain inaccessible.
      vite.middlewares(req, res, () => { res.writeHead(404); res.end('Not found'); }); return;
    }
    if (!production) {
      const template = await vite.transformIndexHtml(req.url, await readFile(resolve(root, 'index.html'), 'utf8'));
      const { render } = await vite.ssrLoadModule('/src/entry-server.js');
      const result = await render(path, !!url.search);
      res.writeHead(result.status, { 'Content-Type': contentTypes['.html'], 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : template.replace('<html lang="uk">', `<html lang="${result.lang}">`).replace('<!--page-head-->', result.head).replace('<!--app-html-->', result.html)); return;
    }
    const dist = resolve(root, 'dist');
    const file = resolve(dist, '.' + path, ...(extname(path) ? [] : ['index.html']));
    if (!file.startsWith(dist + '\\') && !file.startsWith(dist + '/')) { res.writeHead(404); res.end(); return; }
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Missing file');
      const extension = extname(file);
      if (['.mp4', '.webm'].includes(extension)) { serveVideo(req, res, file, info.size, contentTypes[extension]); return; }
      const hashed = /-[\w-]{8,}\.(js|css|woff2)$/.test(file);
      const cache = extension === '.html' ? 'no-cache' : path.startsWith('/assets/') ? `public, max-age=${hashed ? '31536000, immutable' : '2592000'}` : 'public, max-age=3600';
      res.setHeader('Cache-Control', cache);
      res.setHeader('Vary', 'Accept-Encoding');
      let body;
      if (!url.search) {
        const encodings = (req.headers['accept-encoding'] || '').split(',').map(s => s.trim().split(';')).filter(([, q]) => !q || Number(q.trim().replace('q=', '')) > 0).map(([encoding]) => encoding);
        for (const [encoding, suffix] of [['br', '.br'], ['gzip', '.gz']]) {
          if (!encodings.includes(encoding)) continue;
          try { body = await readFile(file + suffix); res.setHeader('Content-Encoding', encoding); break; } catch {}
        }
      }
      body ??= await readFile(file);
      if (url.search && extname(file) === '.html') body = Buffer.from(body.toString().replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">'));
      res.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream', 'Content-Length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404, { 'Content-Type': contentTypes['.html'], 'X-Robots-Tag': 'noindex, nofollow' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(resolve(dist, '404.html')));
    }
  } catch (error) {
    vite?.ssrFixStacktrace(error); console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Не вдалося відкрити сторінку. Спробуйте пізніше.');
  }
});
server.listen(port, host, () => console.log(`Videovitannya: http://${host}:${port} (${production ? 'production preview' : 'Vue development'})`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); vite?.close(); });
