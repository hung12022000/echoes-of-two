import { test, expect } from '@playwright/test';

test('landing, real GLBs, movement, jump, cooperation, boss and restart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if(message.type()==='error') errors.push(message.text()); });
  const models: string[] = [];
  page.on('response', response => { if (response.url().endsWith('.glb') && response.ok()) models.push(response.url()); });
  await page.goto('./');
  await expect(page.getByRole('button', { name: /Tạo phòng hai người/ })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
  await expect(page.getByText('CHƠI MỘT NGƯỜI / ĐỒNG ĐỘI AI')).toBeVisible();
  await page.getByLabel('Chất lượng đồ họa').selectOption('low');
  await page.getByRole('button', { name: /Ready/ }).click();
  const state = page.getByTestId('game-state');
  await expect(state).toHaveAttribute('data-status', 'explore', { timeout: 90000 });
  expect(models.some(url => url.endsWith('/models/hung.glb'))).toBe(true);
  expect(models.some(url => url.endsWith('/models/mei.glb'))).toBe(true);
  await page.keyboard.down('e');
  await expect(page.getByText(/Cộng hưởng thành công/)).toBeVisible();
  await page.keyboard.up('e');
  await page.keyboard.down('w');
  await expect.poll(async () => Number(await state.getAttribute('data-z'))).toBeGreaterThan(56);
  await page.keyboard.up('w');
  await page.keyboard.press('Space');
  await expect.poll(async () => Number(await state.getAttribute('data-y')), { intervals: [50,100,100] }).toBeGreaterThan(0.2);
  await expect(state).toHaveAttribute('data-y', '0.00');
  await page.keyboard.press('b');
  await expect.poll(async () => Number(await state.getAttribute('data-z'))).toBeLessThan(10);
  await page.keyboard.press('Tab');
  await expect(state).toHaveAttribute('data-role', 'mei');
  await page.keyboard.down('j');
  await expect(state).toHaveAttribute('data-status', 'battle');
  await expect.poll(async () => Number(await state.getAttribute('data-boss-hp'))).toBeLessThan(900);
  await page.keyboard.up('j');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.keyboard.press('r');
  await expect(state).toHaveAttribute('data-status', 'explore');
  await expect(state).toHaveAttribute('data-boss-hp', '900');
  expect(errors).toEqual([]);
});

test('invalid room code is rejected and mobile menu does not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: /Vào phòng →/ }).click();
  await expect(page.getByRole('alert')).toContainText('6 ký tự');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.hero-photo')).toHaveCSS('background-position', /100% 50%/);
  await page.setViewportSize({width:920,height:1250});
  await expect(page.locator('.hero-photo')).toHaveCSS('background-position', /85% 50%/);
  await page.screenshot({path:'artifacts/portrait-menu.png'});
});

test('asset failure is visible and retry loads a playable scene', async ({ page }) => {
  await page.route('**/models/hung.glb', route => route.abort());
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
  await page.getByLabel('Chất lượng đồ họa').selectOption('low');
  await page.getByRole('button', { name: /Ready/ }).click();
  await expect(page.getByRole('heading', { name: 'Không thể vào game' })).toBeVisible({ timeout: 60000 });
  await page.unroute('**/models/hung.glb');
  await page.getByRole('button', { name: 'Thử tải lại' }).click();
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-status', 'explore', { timeout: 90000 });
});
