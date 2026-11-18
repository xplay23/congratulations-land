import { test, expect } from '@playwright/test';

test('hero video plays silently, pauses on request and stops outside the viewport', async ({ page }, testInfo) => {
  const webmRequests = [];
  page.on('request', request => { if (/\.webm(?:\?|$)/.test(request.url())) webmRequests.push(request.url()); });
  await page.goto('/');
  const cookies = page.getByRole('button', { name: 'Лише необхідні' });
  if (await cookies.isVisible()) await cookies.click();
  const video = page.locator('.hero-video');
  await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0);
  await expect(video.locator('source:not([type="video/mp4"])')).toHaveCount(0);
  expect(await video.evaluate(v => v.currentSrc)).toMatch(/hero-andriiko-(480|720)\.mp4$/);
  expect(webmRequests).toEqual([]);
  expect(await video.evaluate(v => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, error: v.error }))).toEqual({ muted: true, loop: true, inline: true, error: null });
  await page.getByRole('button', { name: 'Пауза — призупинити фонове відео' }).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
  await video.evaluate(v => new Promise(resolve => { v.addEventListener('seeked', resolve, { once: true }); v.currentTime = 10; }));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `test-results/video-hero-${testInfo.project.name}.png`, scale: 'css', animations: 'disabled' });
  await page.getByRole('button', { name: 'Відтворити фонове відео' }).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
  await page.locator('.footer').scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
});

test('reduced motion keeps the poster until the user chooses playback', async ({ page }) => {
  const mediaRequests = [];
  page.on('request', request => { if (/\.(mp4|webm)$/.test(request.url())) mediaRequests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cookies = page.getByRole('button', { name: 'Лише необхідні' });
  if (await cookies.isVisible()) await cookies.click();
  const video = page.locator('.hero-video');
  await expect(page.getByRole('button', { name: 'Відтворити фонове відео' })).toBeVisible();
  expect(await video.evaluate(v => v.paused && v.currentTime === 0)).toBe(true);
  expect(mediaRequests).toEqual([]);
  expect(await page.locator('.hero-poster img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Відтворити фонове відео' }).click();
  await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Пауза — призупинити фонове відео' }).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
});
