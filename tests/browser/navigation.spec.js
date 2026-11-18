import { test, expect } from '@playwright/test';

const canvas = 'rgb(255, 248, 240)';

test('page links and browser history keep the styled SSR page when JavaScript is unavailable', async ({ page }) => {
  // Reproduces delayed hydration: page styling must not depend on the module graph.
  await page.route('**/*', route => route.request().resourceType() === 'script' ? route.abort() : route.continue());
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('background-color', canvas);
  await expect(page.locator('.header')).toHaveCSS('position', 'fixed');
  await expect(page.locator('html')).toHaveCSS('font-family', /Rubik Variable/);

  await page.locator('.footer a[href="/tsiny/"]').click();
  await expect(page).toHaveURL(/\/tsiny\/$/);
  await expect(page.locator('html')).toHaveCSS('background-color', canvas);
  await expect(page.locator('.price-table')).toBeVisible();
  await expect(page.locator('.header')).toHaveCSS('position', 'fixed');

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveCSS('background-color', canvas);
  await expect(page.locator('.home-hero')).toHaveCount(1);
});

test('the initial document has its warm canvas while CSS and JavaScript are delayed', async ({ page }) => {
  let releaseStyles;
  const pendingStyles = new Promise(resolve => { releaseStyles = resolve; });
  let stylesheetRequested;
  const requested = new Promise(resolve => { stylesheetRequested = resolve; });
  await page.route('**/*', async route => {
    const type = route.request().resourceType();
    if (type === 'script') return route.abort();
    if (type === 'stylesheet') {
      stylesheetRequested();
      await pendingStyles;
    }
    return route.continue();
  });

  try {
    await page.goto('/tsiny/', { waitUntil: 'commit' });
    await requested;
    await expect(page.locator('html')).toHaveCSS('background-color', canvas);
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  } finally {
    releaseStyles();
  }
  await page.waitForLoadState('load');
  await expect(page.locator('.header')).toHaveCSS('position', 'fixed');
  await expect(page.locator('html')).toHaveCSS('background-color', canvas);
});
