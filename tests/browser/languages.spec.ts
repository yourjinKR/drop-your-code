import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { languageFixtures } from '../fixtures/code/languages';

function controls(page: Page) {
  return {
    editor: page.getByRole('textbox', { name: 'Code editor' }),
    select: page.getByRole('complementary', { name: 'Properties' }).getByRole('combobox', { name: 'Language' }),
    status: page.getByRole('status', { name: 'Editor status' }),
  };
}

async function paste(editor: Locator, text: string) {
  await editor.focus();
  await editor.press('Control+a');
  await editor.evaluate((element, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', value);
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  }, text);
}

function readCode(editor: Locator) {
  return editor.locator('.cm-line').allTextContents().then((lines) => lines.join('\n'));
}

function cssRgb(hex: string) {
  return `rgb(${hex.slice(1).match(/../g)?.map((part) => parseInt(part, 16)).join(', ')})`;
}

// Playwright runs against the built app; the same URL matcher also accepts the Vite dev server.
const shellChunk = /\/(?:shell-[\w-]+\.js|[^/]*legacy-modes[^/]*shell[^/]*\.js)(?:\?.*)?$/;
const kotlinChunk = /\/(?:clike-[\w-]+\.js|[^/]*legacy-modes[^/]*clike[^/]*\.js)(?:\?.*)?$/;

for (const fixture of languageFixtures) {
  test(`${fixture.label}: paste, highlighting, commands and Undo`, async ({ page }) => {
    await page.goto('/');
    const { editor, select, status } = controls(page);
    await paste(editor, fixture.code);
    await select.selectOption(fixture.id);
    await expect(status).toContainText(fixture.label);
    expect(await readCode(editor)).toBe(fixture.code);

    if (fixture.id === 'plaintext') {
      await expect(editor.locator('.cm-line span')).toHaveCount(0);
    } else {
      for (const [token, color] of fixture.tokens) {
        await expect(editor.locator('.cm-line span').and(editor.getByText(token, { exact: true })).first())
          .toHaveCSS('color', cssRgb(color));
      }
    }

    await editor.press('Control+Home');
    await editor.press('Shift+End');
    await editor.press('Control+/');
    const [first, ...rest] = fixture.code.split('\n');
    const marker = fixture.comment;
    const commented = typeof marker === 'string' ? `${marker} ${first}`
      : marker ? `${marker[0]} ${first} ${marker[1]}` : first;
    expect(await readCode(editor)).toBe([commented, ...rest].join('\n'));
    if (marker) {
      await editor.press('Control+/');
      expect(await readCode(editor)).toBe(fixture.code);
    }

    await paste(editor, fixture.indent.before);
    await editor.press('Control+End');
    await editor.press('Enter');
    const indent = ' '.repeat(fixture.indent.spaces);
    expect(await readCode(editor)).toBe(`${fixture.indent.before}\n${indent}`);
    await editor.press('Tab');
    expect(await readCode(editor)).toBe(`${fixture.indent.before}\n${indent}  `);
    await select.selectOption(fixture.id === 'plaintext' ? 'json' : 'plaintext');
    await expect(status).toContainText(fixture.id === 'plaintext' ? 'JSON' : 'Plain Text');
    await editor.press('Control+z');
    expect(await readCode(editor)).toBe(`${fixture.indent.before}\n${indent}`);
  });
}

test('editing and a second language are available while the first chunk is delayed', async ({ page }) => {
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  let routed!: () => void;
  const requested = new Promise<void>((resolve) => { routed = resolve; });
  await page.route(kotlinChunk, async (route) => {
    routed();
    await hold;
    await route.continue();
  });
  await page.goto('/');
  const { editor, select, status } = controls(page);
  try {
    await select.selectOption('kotlin');
    await requested;
    await expect(page.getByText('Loading Kotlin…')).toBeVisible();
    await expect(status).toContainText('Plain Text');
    await paste(editor, 'def demo():\n  return "한글"');
    await select.selectOption('python');
    await expect(status).toContainText('Python');
  } finally {
    release();
  }
  // Select Kotlin again; this uses the pending/successful load without resetting the editor.
  await select.selectOption('kotlin');
  await expect(status).toContainText('Kotlin');
  expect(await readCode(editor)).toBe('def demo():\n  return "한글"');
  await editor.press('Control+z');
  expect(await readCode(editor)).toBe('');
});

test('offline selection fails safely, previously loaded languages remain usable and Retry works after reconnecting', async ({ context, page }) => {
  await page.goto('/');
  const { editor, select, status } = controls(page);
  await select.selectOption('java');
  await expect(status).toContainText('Java');
  await paste(editor, 'class Demo {}');
  await select.selectOption('plaintext');
  await expect(status).toContainText('Plain Text');
  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await select.selectOption('java');
  await expect(status).toContainText('Java');
  await select.selectOption('shell');
  await expect(page.getByRole('alert')).toContainText('Could not load Shell.');
  await expect(select).toHaveValue('java');
  await expect(status).toContainText('Java');
  expect(await readCode(editor)).toBe('class Demo {}');

  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(status).toContainText('Shell');
  await expect(select).toBeFocused();
  expect(await readCode(editor)).toBe('class Demo {}');
});

test('an unavailable production chunk leaves code intact and offers a safe recovery path', async ({ page }) => {
  await page.route(shellChunk, (route) => route.abort('failed'));
  const chunkFailed = page.waitForEvent('requestfailed', (request) => shellChunk.test(request.url()));
  await page.goto('/');
  const { editor, select, status } = controls(page);
  await select.selectOption('python');
  await expect(status).toContainText('Python');
  await paste(editor, 'print("한글")');
  await select.selectOption('shell');
  await chunkFailed;
  await expect(page.getByRole('alert')).toContainText('Could not load Shell.');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('alert')).toContainText('save a copy of your code before refreshing');
  await expect(status).toContainText('Python');
  expect(await readCode(editor)).toBe('print("한글")');
  await select.selectOption('plaintext');
  await expect(status).toContainText('Plain Text');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await editor.press('Control+z');
  expect(await readCode(editor)).toBe('');
});

test('Plain Text startup defers parsers and language requests never carry pasted code', async ({ page, baseURL }) => {
  const requests: { url: string; method: string; data: string | null }[] = [];
  page.on('request', (request) => requests.push({
    url: request.url(), method: request.method(), data: request.postData(),
  }));
  await page.goto('/');
  const { editor, select, status } = controls(page);
  await expect(status).toContainText('Plain Text');
  await page.waitForLoadState('networkidle');
  const jsRequests = () => requests.filter(({ url }) => new URL(url).pathname.endsWith('.js'));
  if (process.env['PLAYWRIGHT_SERVER_MODE'] !== 'dev') {
    expect(jsRequests().map(({ url }) => new URL(url).pathname)).toEqual([
      expect.stringMatching(/^\/assets\/index-[\w-]+\.js$/),
    ]);
  }
  const source = 'echo "private-한글-fixture"';
  await paste(editor, source);
  const loaded = page.waitForResponse((response) => shellChunk.test(response.url()) && response.ok());
  await select.selectOption('shell');
  await loaded;
  await expect(status).toContainText('Shell');
  expect(await readCode(editor)).toBe(source);
  for (const { url, method, data } of requests) {
    expect(new URL(url).origin).toBe(baseURL);
    expect(method).toBe('GET');
    expect(data).toBeNull();
    expect(url).not.toContain('private-');
  }
});
