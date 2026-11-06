import { readFileSync } from 'node:fs';
import { expect, test as base } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

type EditorAudit = { runtime: string[]; external: string[]; data: string[] };

const test = base.extend<{ audit: EditorAudit }>({
  audit: [async ({ context, page, baseURL }, use) => {
    if (!baseURL) throw new Error('Editor tests require a localhost baseURL.');
    const origin = new URL(baseURL).origin;
    const audit: EditorAudit = { runtime: [], external: [], data: [] };
    page.on('pageerror', (error) => audit.runtime.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') audit.runtime.push(message.text());
    });
    page.on('dialog', async (dialog) => {
      audit.runtime.push(`Unexpected dialog: ${dialog.message()}`);
      await dialog.dismiss();
    });
    context.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) audit.external.push(request.url());
      if (!['GET', 'HEAD'].includes(request.method()) || request.postData() !== null) {
        audit.data.push(`${request.method()} ${request.url()}`);
      }
    });
    await context.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin !== origin) await route.abort('blockedbyclient');
      else await route.continue();
    });
    await context.routeWebSocket('**/*', (socket) => {
      const url = new URL(socket.url());
      url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
      if (url.origin !== origin) {
        audit.external.push(socket.url());
        socket.close();
      } else {
        socket.connectToServer();
      }
    });
    await use(audit);
    expect(audit.runtime, 'runtime and console errors').toEqual([]);
    expect(audit.external, 'external requests').toEqual([]);
    expect(audit.data, 'requests carrying user data').toEqual([]);
  }, { auto: true }],
});

async function pasteCode(editor: Locator, text: string) {
  await editor.focus();
  // Exercise CodeMirror's browser paste handler without relying on OS clipboard permissions.
  await editor.evaluate((element, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', value);
    element.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData, bubbles: true, cancelable: true,
    }));
  }, text);
}

async function copyAllCode(page: Page, editor: Locator): Promise<string> {
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+a');
  // Read the real copy event after CodeMirror populated clipboardData. This observes
  // the whole document, including virtualized lines, without a production test hook.
  await page.evaluate(() => {
    document.addEventListener('copy', (event) => {
      document.documentElement.setAttribute(
        'data-test-copied-code', event.clipboardData?.getData('text/plain') ?? '',
      );
    }, { once: true });
  });
  await page.keyboard.press('ControlOrMeta+c');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-test-copied-code'));
  const text = await page.locator('html').getAttribute('data-test-copied-code');
  await page.evaluate(() => document.documentElement.removeAttribute('data-test-copied-code'));
  if (text === null) throw new Error('The text copy event was not observed.');
  return text;
}

test('pastes and copies plain text through the browser clipboard', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const code = 'first\n\t한글 😀\n';
  await page.evaluate((text) => navigator.clipboard.writeText(text), code);
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+v');

  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('3 lines');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(async () => (
    await page.evaluate(() => navigator.clipboard.readText())
  ).replace(/\r\n/g, '\n')).toBe(code);
});

test('accepts input, selection, replacement, deletion and Undo/Redo', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await expect(editor).toBeVisible();
  await expect(editor).toHaveText('');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('1 line');

  await editor.focus();
  await page.keyboard.insertText('alpha beta');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText('replacement');
  expect(await copyAllCode(page, editor)).toBe('replacement');

  await page.keyboard.press('ControlOrMeta+z');
  expect(await copyAllCode(page, editor)).toBe('alpha beta');
  // Verify the installed basic history map; IDE preset differences belong to task 4.
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y');
  expect(await copyAllCode(page, editor)).toBe('replacement');
  await page.keyboard.press('Backspace');
  await expect(editor).toHaveText('');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('1 line');
});

test('keeps basic auto-indent, Tab/Shift+Tab and a keyboard exit path', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await pasteCode(editor, '  first');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('second');
  expect(await copyAllCode(page, editor)).toBe('  first\n  second');

  await page.keyboard.press('Tab');
  expect(await copyAllCode(page, editor)).toBe('    first\n    second');
  await page.keyboard.press('Shift+Tab');
  expect(await copyAllCode(page, editor)).toBe('  first\n  second');

  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  await expect(editor).not.toBeFocused();
});

test('preserves all 300 pasted lines and final newline in shared state and text copy', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const code = Array.from({ length: 300 }, (_, index) => `const line${index + 1} = ${index};`).join('\n') + '\n';
  await pasteCode(editor, code);

  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('301 lines');
  expect(await copyAllCode(page, editor)).toBe(code);
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('1 line');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await copyAllCode(page, editor)).toBe(code);
});

test('normalizes CRLF, preserves whitespace and Unicode, and treats HTML/URLs as text', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const code = readFileSync(new URL('../fixtures/code/editor-input.txt', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n') + '\n';
  await pasteCode(editor, code.replace(/\n/g, '\r\n'));

  expect(await copyAllCode(page, editor)).toBe(code);
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText(
    `${code.split('\n').length} lines`,
  );
  expect(await page.evaluate(() => '__codeExecuted' in window)).toBe(false);
  await expect(editor.locator('script')).toHaveCount(0);
});

test('keeps a long unwrapped line inside the editor scroll area on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const code = 'long-line '.repeat(2_000);
  await pasteCode(editor, code);

  expect(await copyAllCode(page, editor)).toBe(code);
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('1 line');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
