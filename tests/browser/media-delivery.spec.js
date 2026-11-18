import { test, expect } from '@playwright/test';

test('Mykolay photo fills its frame and selects enough pixels for the cover crop', async ({ page }) => {
  for (const width of [320, 390, 640, 641, 768, 900, 901, 1000, 1001, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/svyatyj-mykolaj/');
    await page.locator('#example img').evaluate(img => img.decode());
    const photo = await page.locator('#example').evaluate(frame => {
      const img = frame.querySelector('img'), box = frame.getBoundingClientRect(), image = img.getBoundingClientRect();
      return {
        gaps: [image.x - box.x, image.y - box.y, image.width - box.width, image.height - box.height],
        sourceWidth: Number(img.currentSrc.match(/-(\d+)\.(avif|webp|jpg)$/)[1]),
        requiredWidth: Math.min(1280, Math.max(box.width, box.height * 16 / 9) * devicePixelRatio),
        overflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    for (const gap of photo.gaps) expect(Math.abs(gap), `frame coverage at ${width}px`).toBeLessThan(1);
    expect(photo.sourceWidth, `source resolution at ${width}px`).toBeGreaterThanOrEqual(Math.floor(photo.requiredWidth));
    expect(photo.overflow, `horizontal overflow at ${width}px`).toBe(false);
  }
});

test('robots, sitemap, compressed HTML and both MP4 sizes are served correctly', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).not.toContain('Sitemap:');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const xml = await sitemap.text();
  expect(xml).not.toContain('<loc>');
  expect(xml).not.toContain('/kabinet/');
  for (const height of [480, 720]) {
    const media = await request.get(`/assets/hero-andriiko-${height}.mp4`, { headers: { Range: 'bytes=0-1023' } });
    expect(media.status()).toBe(206);
    expect(media.headers()['content-type']).toBe('video/mp4');
    expect((await media.body()).length).toBe(1024);
  }
  const compressed = await request.get('/', { headers: { 'Accept-Encoding': 'br' } });
  expect(compressed.headers()['content-encoding']).toBe('br');
  expect(await compressed.text()).toContain('hero-andriiko-poster');
  const query = await request.get('/zamovlennya/?product=song');
  expect(await query.text()).toContain('noindex, nofollow');
});

test('MP4 playback works with a JPEG poster when AVIF and WebP are unavailable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Emulate source selection on a browser that cannot decode AVIF/WebP.
  await page.locator('.hero-poster source').evaluateAll(nodes => nodes.forEach(node => node.type = 'image/unsupported'));
  await expect.poll(() => page.locator('.hero-poster img').evaluate(img => img.complete && img.naturalWidth > 0 && img.currentSrc.endsWith('.jpg'))).toBe(true);
  const cookies = page.getByRole('button', { name: 'Лише необхідні' });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole('button', { name: 'Відтворити фонове відео' }).click();
  await expect.poll(() => page.locator('video').evaluate(video => video.currentTime)).toBeGreaterThan(0);
  expect(await page.locator('video').evaluate(video => video.currentSrc)).toMatch(/\.mp4$/);
});
