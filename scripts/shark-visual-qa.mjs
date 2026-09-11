import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const url = process.env.QA_URL ?? 'http://127.0.0.1:4173/echoes-of-two/';
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(url);
await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
await page.getByLabel('Chất lượng đồ họa').selectOption('low');
await page.getByRole('button', { name: /Ready/ }).click();
const state = page.getByTestId('game-state');
await state.waitFor({ state: 'visible', timeout: 90000 });
mkdirSync('artifacts', { recursive: true });

// Reuse the real persisted state format, changing only the natural raid clock so
// visual QA does not depend on headless renderer FPS (the game caps simulation dt).
await page.getByRole('button', { name: /Lưu/ }).click();
await page.evaluate(() => {
  const key = 'echoes.oceanbound.save.v4.solo';
  const raw = localStorage.getItem(key);
  if (!raw) throw new Error('SOLO_SAVE_MISSING');
  const save = JSON.parse(raw);
  save.sharkRaid = { ...save.sharkRaid, phase: 'idle', countdown: .2 };
  localStorage.setItem(key, JSON.stringify(save));
});
await page.reload();
await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
await page.getByLabel('Chất lượng đồ họa').selectOption('low');
await page.getByRole('button', { name: /Ready/ }).click();
await state.waitFor({ state: 'visible', timeout: 90000 });

await page.waitForFunction(() => document.querySelector('[data-testid="game-state"]')?.getAttribute('data-shark') === 'warning', undefined, { timeout: 15000 });
await page.screenshot({ path: 'artifacts/shark-warning.png' });
await page.waitForFunction(() => document.querySelector('[data-testid="game-state"]')?.getAttribute('data-shark') === 'biting', undefined, { timeout: 60000 });
await page.keyboard.press('v');
await page.waitForTimeout(350);
await page.screenshot({ path: 'artifacts/shark-bite.png' });

console.log(JSON.stringify({ warning: true, biting: true, errors }));
await browser.close();
if (errors.length) process.exitCode = 1;
