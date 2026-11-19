import { test, expect } from '@playwright/test';

test('birthday order keeps the chosen occasion and format through payment', async ({ page }) => {
  let submitted;
  await page.route('**/api/plata/config', route => route.fulfill({ json: { testAvailable: true } }));
  await page.route('**/api/plata/invoices', route => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: { pageUrl: 'https://pay.monobank.ua/example-test' } });
  });
  await page.route('https://pay.monobank.ua/example-test', route => route.fulfill({ body: 'Sandbox checkout' }));
  await page.goto('/den-narodzhennya/?occasion=jubilee#order');
  await page.getByRole('button', { name: 'Лише необхідні' }).click();
  const form = page.locator('#order');
  await expect(form.getByRole('radio')).toHaveCount(3);
  await expect(form.locator('[value=birthday]')).toBeChecked();
  await expect(form.locator('.order-total')).toContainText('549');
  await form.locator('[value=photo]').check();
  await expect(form.locator('.order-total')).toContainText('199');
  await form.getByRole('button', { name: 'Далі' }).click();
  await expect(form.locator('#occasion')).toHaveValue('jubilee');
  await form.locator('#occasion').selectOption('wedding-anniversary');
  await form.getByRole('button', { name: 'Далі' }).click();
  await form.locator('#name').fill('Олено');
  await expect(form.locator('#fact1')).toHaveCount(0);
  await form.locator('#photos').setInputFiles('public/assets/logo.png');
  await form.locator('#email').fill('test@example.com');
  for (const box of await form.getByRole('checkbox').all()) await box.check();
  await form.getByRole('button', { name: 'Далі' }).click();
  await expect(form.locator('.order-summary')).toContainText('Річниця весілля');
  await expect(form.locator('.order-summary')).toContainText('logo.png');
  await form.getByRole('button', { name: 'До оплати' }).click();
  await form.getByRole('button', { name: 'Тестова оплата через plata by mono' }).click();
  await expect(page).toHaveURL('https://pay.monobank.ua/example-test');
  expect(submitted).toEqual({ orderId: expect.any(String), product: 'birthday', variant: 'photo', occasion: 'wedding-anniversary' });
});

test('Russian birthday order and its Ukrainian alternate open directly', async ({ page }) => {
  await page.goto('/ru/den-rozhdeniya/?occasion=not-a-choice');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  await page.locator('#order input[value=song]').check();
  await page.getByRole('button', { name: 'Далее' }).click();
  await expect(page.locator('#occasion')).toHaveValue('birthday');
  await page.getByRole('button', { name: 'Далее' }).click();
  await expect(page.locator('#fact1')).toBeVisible();
  await expect(page.locator('#photos')).toHaveCount(0);
  await page.getByRole('link', { name: 'Українською' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
});
