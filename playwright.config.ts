import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: './tests/e2e', timeout: 120000, workers: 1,
  expect: { timeout: 20000 },
  use: {
    baseURL: 'http://127.0.0.1:4173/echoes-of-two/',
    viewport: { width: 960, height: 640 },
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run preview -- --host 127.0.0.1', port: 4173, reuseExistingServer: !process.env.CI },
});
