import { chromium } from 'playwright';

const url = process.env.QA_URL ?? 'http://127.0.0.1:4173/echoes-of-two/';
const seconds = Number(process.env.QA_SOAK_SECONDS ?? 3600);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('crash', () => errors.push('PAGE_CRASHED'));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
await page.getByLabel('Chất lượng đồ họa').selectOption('low');
await page.getByRole('button', { name: /Ready/ }).click();
const state = page.getByTestId('game-state');
await state.waitFor({ state: 'visible', timeout: 90000 });

const started = Date.now();
let samples = 0;
let minimumFps = Infinity;
while ((Date.now() - started) / 1000 < seconds) {
  const key = samples % 4 === 0 ? 'ArrowUp' : samples % 4 === 1 ? 'ArrowRight' : samples % 4 === 2 ? 'ArrowDown' : 'ArrowLeft';
  await page.keyboard.down(key); await page.waitForTimeout(350); await page.keyboard.up(key);
  await page.waitForTimeout(9650);
  const sample = await state.evaluate(element => ({
    x: Number(element.getAttribute('data-x')),
    y: Number(element.getAttribute('data-y')),
    z: Number(element.getAttribute('data-z')),
    text: element.textContent,
    fps: Number(document.querySelector('.mode-badge')?.textContent?.match(/(\d+) FPS/)?.[1] ?? 0),
  }));
  if (![sample.x, sample.y, sample.z, sample.fps].every(Number.isFinite)) errors.push(`NON_FINITE_STATE:${JSON.stringify(sample)}`);
  if (Math.hypot(sample.x / 1.08, sample.z - 15) > 70.5) errors.push(`OUT_OF_WORLD_BOUNDS:${sample.x},${sample.z}`);
  if (sample.fps > 0) minimumFps = Math.min(minimumFps, sample.fps);
  samples++;
  if (errors.length) break;
}

const result = { requestedSeconds: seconds, elapsedSeconds: Math.round((Date.now() - started) / 1000), samples, minimumFps: Number.isFinite(minimumFps) ? minimumFps : null, errors };
await browser.close();
console.log(JSON.stringify(result));
if (errors.length || result.elapsedSeconds < seconds) process.exitCode = 1;
