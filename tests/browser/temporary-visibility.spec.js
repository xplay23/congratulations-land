import { test, expect } from '@playwright/test';

test('temporary noindex covers pages and media; hidden product cannot be ordered', async ({ page, request }) => {
  for (const path of ['/', '/tsiny/', '/svyatyj-mykolaj/', '/assets/video-gift.svg']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
    if (path.endsWith('/')) expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow">');
  }
  expect((await request.get('/novyj-rik/')).status()).toBe(404);
  await page.goto('/');
  await expect(page.locator('#hero-product')).toHaveValue('mykolay');
  await expect(page.locator('a[href="/novyj-rik/"], option[value="newyear"]')).toHaveCount(0);
  await page.goto('/zamovlennya/?product=newyear');
  await expect(page.locator('#product')).toHaveValue('mykolay');
  await expect(page.locator('#hero')).toHaveValue('mykolay');
  await expect(page.locator('option[value="newyear"], option[value="did"], option[value="santa"]')).toHaveCount(0);
});
