import { test, expect } from '@playwright/test';

async function dismissCookies(page) {
  const button = page.getByRole('button', { name: 'Лише необхідні' });
  if (await button.isVisible()) await button.click();
}

test('Vue hydrates, local media loads and layouts fit the viewport', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || /hydration/i.test(m.text())) errors.push(m.text()); });
  for (const path of ['/', '/svyatyj-mykolaj/', '/den-narodzhennya/', '/ozhyvyty-foto/', '/pisnya-na-zamovlennya/', '/tsiny/', '/blog/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await dismissCookies(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('body')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.locator('img').evaluateAll(images => images.filter(i => i.loading !== 'lazy').every(i => i.complete && i.naturalWidth > 0))).toBe(true);
    if (path === '/svyatyj-mykolaj/') await page.screenshot({ path: `test-results/product-${testInfo.project.name}.png`, scale: 'css', animations: 'disabled' });
  }
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  // Load below-fold media for visual QA without altering production lazy loading.
  await page.locator('img').evaluateAll(images => Promise.all(images.map(i => { i.loading = 'eager'; return i.decode(); })));
  await page.screenshot({ path: `test-results/home-${testInfo.project.name}.png`, fullPage: true, scale: 'css', animations: 'disabled' });
  await page.screenshot({ path: `test-results/hero-${testInfo.project.name}.png`, scale: 'css', animations: 'disabled' });
  expect(errors).toEqual([]);
});

test('hero selection opens the chosen product and mobile menu is keyboard dismissible', async ({ page }, testInfo) => {
  await page.goto('/'); await dismissCookies(page);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Відкрити меню' }).click();
    await expect(page.locator('#main-nav').getByRole('link', { name: 'Ціни', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Відкрити меню' })).toBeFocused();
    await expect(page.locator('#main-nav')).not.toBeVisible();
  }
  await page.getByLabel('Оберіть привітання').selectOption('song');
  await page.locator('.hero-order').getByRole('button', { name: 'Замовити' }).click();
  await expect(page).toHaveURL(/\/zamovlennya\/\?product=song/);
  await expect(page.locator('#product')).toHaveValue('song');
});

test('song order validates fields, preserves values and never transmits personal data', async ({ page }) => {
  const submissions = [];
  page.on('request', r => { if (r.method() !== 'GET') submissions.push(r.url()); });
  await page.goto('/zamovlennya/?product=song'); await dismissCookies(page);
  await expect(page.locator('#product')).toHaveValue('song');
  await page.getByRole('button', { name: 'Далі', exact: false }).click();
  await expect(page.locator('#genre')).toBeVisible();
  await expect(page.locator('#photos')).toHaveCount(0);
  await page.locator('#name').fill('Олена');
  await page.getByRole('button', { name: 'Використати «Олено»' }).click();
  await expect(page.locator('#name')).toHaveValue('Олено');
  await page.locator('#fact1').fill('Любить гори'); await page.locator('#fact2').fill('Грає на гітарі'); await page.locator('#fact3').fill('Мріє про море');
  await page.getByRole('button', { name: 'Далі', exact: false }).click();
  await page.locator('#email').fill('test@example.com'); await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: 'Перевірити замовлення' }).click();
  await expect(page.locator('.order-summary')).toContainText('Олено');
  await expect(page.locator('.order-summary')).toContainText('399 грн');
  await expect(page.getByText('Перевірте написання імені', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Назад', exact: false }).click();
  await expect(page.locator('#email')).toHaveValue('test@example.com');
  expect(submissions).toEqual([]);

  let selection;
  await page.route('**/api/plata/config', route => route.fulfill({ json: { testAvailable: true } }));
  await page.route('**/api/plata/invoices', route => {
    selection = route.request().postDataJSON();
    return route.fulfill({ json: { pageUrl: 'https://pay.monobank.ua/browser-test' } });
  });
  await page.route('https://pay.monobank.ua/browser-test', route => route.fulfill({
    status: 302, headers: { location: new URL('/oplata/#' + selection.orderId, page.url()).href }
  }));
  await page.route('**/api/plata/invoices/*', route => route.fulfill({
    json: { status: 'success', label: 'Пісня з іменем', amount: 39900 }
  }));
  await page.getByRole('button', { name: 'Перевірити замовлення' }).click();
  await page.getByRole('button', { name: 'Тестова оплата через plata by mono' }).click();
  await expect(page.getByText('Тестова оплата успішна.')).toBeVisible();
  expect(selection).toEqual({ product: 'song', orderId: expect.stringMatching(/^[a-f0-9-]{36}$/) });
});

test('Mykolay uses a separate order per recipient and requires a photo', async ({ page }) => {
  await page.goto('/zamovlennya/'); await dismissCookies(page);
  await expect(page.locator('#children option[value="2"]')).toHaveCount(0);
  await expect(page.locator('.order-total')).toContainText('399 грн');
  await expect(page.getByText('Для кількох дітей оформіть окреме замовлення для кожної дитини.')).toBeVisible();
  await page.getByRole('button', { name: 'Далі', exact: false }).click();
  await expect(page.locator('#name2')).toHaveCount(0);
  await page.locator('#name').fill('Тарасе');
  await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: 'Далі', exact: false }).click();
  await expect(page.getByRole('alert')).toContainText('Додайте фото');
  await page.locator('#photos').setInputFiles(['public/assets/logo.png']);
  await page.getByRole('button', { name: 'Далі', exact: false }).click();
  await expect(page.locator('#email')).toBeVisible();
});

test('canonical redirects, query noindex and real 404 response', async ({ request }) => {
  const redirect = await request.get('/Svyatyj-Mykolaj', { maxRedirects: 0 });
  expect(redirect.status()).toBe(301); expect(redirect.headers().location).toBe('/svyatyj-mykolaj/');
  const query = await request.get('/svyatyj-mykolaj/?utm_source=test');
  expect(await query.text()).toContain('noindex, nofollow');
  const missing = await request.get('/does-not-exist/'); expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('Сторінку не знайдено');
});
