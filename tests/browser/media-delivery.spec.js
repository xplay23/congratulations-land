import { test, expect } from '@playwright/test';

test('robots, sitemap, compressed HTML and both video formats are served correctly', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).not.toContain('Sitemap:');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const xml = await sitemap.text();
  expect(xml).not.toContain('<loc>');
  expect(xml).not.toContain('/kabinet/');
  for (const extension of ['webm', 'mp4']) {
    const media = await request.get(`/assets/hero-andriiko-480.${extension}`, { headers: { Range: 'bytes=0-1023' } });
    expect(media.status()).toBe(206);
    expect(media.headers()['content-type']).toBe(`video/${extension}`);
    expect((await media.body()).length).toBe(1024);
  }
  const compressed = await request.get('/', { headers: { 'Accept-Encoding': 'br' } });
  expect(compressed.headers()['content-encoding']).toBe('br');
  expect(await compressed.text()).toContain('hero-andriiko-poster');
  const query = await request.get('/zamovlennya/?product=song');
  expect(await query.text()).toContain('noindex, nofollow');
});

test('MP4 and JPEG fallbacks work when modern source choices are unavailable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Emulate source selection on a browser that cannot decode VP9 or AVIF/WebP.
  await page.locator('source[type^="video/webm"]').evaluateAll(nodes => nodes.forEach(node => node.type = 'video/unsupported'));
  await page.locator('.hero-poster source').evaluateAll(nodes => nodes.forEach(node => node.type = 'image/unsupported'));
  await expect.poll(() => page.locator('.hero-poster img').evaluate(img => img.complete && img.naturalWidth > 0 && img.currentSrc.endsWith('.jpg'))).toBe(true);
  const cookies = page.getByRole('button', { name: 'Лише необхідні' });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole('button', { name: 'Відтворити фонове відео' }).click();
  await expect.poll(() => page.locator('video').evaluate(video => video.currentTime)).toBeGreaterThan(0);
  expect(await page.locator('video').evaluate(video => video.currentSrc)).toMatch(/\.mp4$/);
});
