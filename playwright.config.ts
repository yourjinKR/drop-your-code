import { defineConfig, devices } from '@playwright/test';

const isDevServer = process.env['PLAYWRIGHT_SERVER_MODE'] === 'dev';
const origin = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: origin,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: isDevServer
      ? 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort'
      : 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: origin,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
