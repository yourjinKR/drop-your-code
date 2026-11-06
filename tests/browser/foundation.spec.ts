import { expect, test as base } from '@playwright/test';

type BrowserIssues = {
  runtime: string[];
  console: string[];
  failedRequests: string[];
  failedResponses: string[];
  externalRequests: string[];
  dataRequests: string[];
};

// Install the observers before navigation so initial asset loads are covered.
const test = base.extend<{ audit: BrowserIssues }>({
  audit: [
    async ({ context, page, baseURL }, use) => {
      if (!baseURL) throw new Error('Foundation tests require a localhost baseURL.');

      const origin = new URL(baseURL).origin;
      const issues: BrowserIssues = {
        runtime: [],
        console: [],
        failedRequests: [],
        failedResponses: [],
        externalRequests: [],
        dataRequests: [],
      };

      context.on('request', (request) => {
        if (new URL(request.url()).origin !== origin) {
          issues.externalRequests.push(request.url());
        }
        if (!['GET', 'HEAD'].includes(request.method()) || request.postData() !== null) {
          issues.dataRequests.push(`${request.method()} ${request.url()}`);
        }
      });
      context.on('requestfailed', (request) => {
        issues.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`);
      });
      context.on('response', (response) => {
        if (response.status() >= 400) {
          issues.failedResponses.push(`${response.status()} ${response.url()}`);
        }
      });
      await context.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin !== origin) {
          await route.abort('blockedbyclient');
        } else {
          await route.continue();
        }
      });
      await context.routeWebSocket('**/*', (socket) => {
        const url = new URL(socket.url());
        url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
        if (url.origin !== origin) {
          issues.externalRequests.push(socket.url());
          socket.close();
        } else {
          // Vite's dev-only HMR connection is local and carries no user code.
          socket.connectToServer();
        }
      });
      page.on('pageerror', (error) => issues.runtime.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') issues.console.push(message.text());
      });

      await use(issues);

      expect(issues.runtime, 'uncaught runtime errors').toEqual([]);
      expect(issues.console, 'browser console errors').toEqual([]);
      expect(issues.failedRequests, 'failed requests').toEqual([]);
      expect(issues.failedResponses, 'HTTP error responses').toEqual([]);
      expect(issues.externalRequests, 'external HTTP/WebSocket requests').toEqual([]);
      expect(issues.dataRequests, 'requests carrying data or modifying server state').toEqual([]);
    },
    { auto: true },
  ],
});

test('opens the static root with an English editor and no unsupported actions', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Drop Your Code/);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Drop Your Code' })).toBeVisible();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Code editor' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('1 line');
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('button', { name: /copy|export|history|preview/i }),
  ).toHaveCount(0);
  await page.waitForLoadState('networkidle');
});

test('lets keyboard users skip directly to the workspace', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to editor' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main', { name: 'Editor' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Keymap' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Code editor' })).toBeFocused();
});

for (const width of [360, 768, 1280]) {
  test(`keeps the shell reachable at ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await editor.scrollIntoViewIfNeeded();
    await expect(editor).toBeInViewport();
    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fitsViewport).toBe(true);
  });
}

// CSS zoom exercises scaling and reflow; this does not replace native browser zoom QA.
test('preserves access to the editor and status with 200% CSS zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await editor.scrollIntoViewIfNeeded();
  await expect(editor).toBeInViewport();
  const status = page.getByRole('status', { name: 'Editor status' });
  await status.scrollIntoViewIfNeeded();
  await expect(status).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
