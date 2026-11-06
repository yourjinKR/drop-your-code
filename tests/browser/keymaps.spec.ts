import { expect, test as base } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ audit: string[] }>({
  audit: [async ({ context, page, baseURL }, use) => {
    if (!baseURL) throw new Error('Keymap tests require a localhost baseURL.');
    const origin = new URL(baseURL).origin;
    const issues: string[] = [];
    page.on('pageerror', (error) => issues.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') issues.push(message.text());
    });
    context.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) issues.push(`External request: ${request.url()}`);
      if (!['GET', 'HEAD'].includes(request.method()) || request.postData() !== null) {
        issues.push(`Data request: ${request.method()} ${request.url()}`);
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
        issues.push(`External WebSocket: ${socket.url()}`);
        socket.close();
      } else socket.connectToServer();
    });
    await use(issues);
    expect(issues, 'runtime, console and external/data requests').toEqual([]);
  }, { auto: true }],
});

async function paste(editor: Locator, code: string) {
  await editor.focus();
  await editor.evaluate((element, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  }, code);
}

async function readAll(page: Page, editor: Locator): Promise<string> {
  await editor.focus();
  await page.keyboard.press('Control+a');
  await page.evaluate(() => {
    document.addEventListener('copy', (event) => {
      document.documentElement.setAttribute('data-test-keymap-copy', event.clipboardData?.getData('text/plain') ?? '');
    }, { once: true });
  });
  await page.keyboard.press('Control+c');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-test-keymap-copy'));
  const code = await page.locator('html').getAttribute('data-test-keymap-copy');
  await page.evaluate(() => document.documentElement.removeAttribute('data-test-keymap-copy'));
  if (code === null) throw new Error('Expected a text copy event.');
  return code;
}

test('ctrl_y_matches_active_preset', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const selector = page.getByRole('combobox', { name: 'Keymap' });
  await expect(selector).toHaveValue('vscode');
  await paste(editor, 'alpha\nbeta');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+y');
  expect(await readAll(page, editor)).toBe('alpha\nbet');

  await selector.selectOption('intellij');
  await editor.focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.press('Control+y');
  expect(await readAll(page, editor)).toBe('alpha');
  await page.keyboard.press('Control+z');
  expect(await readAll(page, editor)).toBe('alpha\nbet');
});

test('switch_preserves_document_selection_history', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const selector = page.getByRole('combobox', { name: 'Keymap' });
  await paste(editor, 'abcd!');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  const originalNode = await editor.elementHandle();

  await selector.focus();
  await selector.selectOption('intellij');
  await editor.focus();
  await page.keyboard.insertText('X');
  expect(await readAll(page, editor)).toBe('abcXd!');
  expect(await originalNode?.evaluate((element) => element.isConnected)).toBe(true);
  await page.keyboard.press('Control+z');
  expect(await readAll(page, editor)).toBe('abcd!');
  await page.keyboard.press('Control+z');
  expect(await readAll(page, editor)).toBe('');
});

test('switching removes the previous preset duplicate binding', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const selector = page.getByRole('combobox', { name: 'Keymap' });
  await selector.selectOption('intellij');
  await paste(editor, 'alpha');
  await page.keyboard.press('Control+d');
  expect(await readAll(page, editor)).toBe('alpha\nalpha');

  await selector.selectOption('vscode');
  await editor.focus();
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('Control+d');
  expect(await readAll(page, editor)).toBe('alpha\nalpha');
});

test('settings_input_is_not_editor', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const selector = page.getByRole('combobox', { name: 'Keymap' });
  await selector.selectOption('intellij');
  await paste(editor, 'alpha\nbeta');
  await selector.focus();
  await page.keyboard.press('Control+y');

  // An ordinary field models future Properties/title inputs without a production test hook.
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Focus boundary test input');
    document.querySelector('main')?.append(input);
  });
  const field = page.getByRole('textbox', { name: 'Focus boundary test input' });
  await field.fill('ordinary field');
  await page.keyboard.press('Control+y');
  await expect(field).toHaveValue('ordinary field');
  expect(await readAll(page, editor)).toBe('alpha\nbeta');
});

for (const preset of ['intellij', 'vscode'] as const) {
  test(`line deletion Undo and Redo preserve recently typed code (${preset})`, async ({ page }) => {
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await page.getByRole('combobox', { name: 'Keymap' }).selectOption(preset);
    await editor.focus();
    await page.keyboard.insertText('first\nsecond');
    await page.keyboard.press(preset === 'intellij' ? 'Control+y' : 'Control+Shift+K');
    expect(await readAll(page, editor)).toBe('first');
    await page.keyboard.press('Control+z');
    expect(await readAll(page, editor)).toBe('first\nsecond');
    // Shifted letter keys use the actual uppercase KeyboardEvent.key.
    await page.keyboard.press(preset === 'intellij' ? 'Control+Shift+Z' : 'Control+y');
    expect(await readAll(page, editor)).toBe('first');
  });

  test(`unselected_cut_is_linewise (${preset})`, async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await page.getByRole('combobox', { name: 'Keymap' }).selectOption(preset);
    await paste(editor, 'first\nsecond\nlast');
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Control+x');

    // CodeMirror's native linewise clipboard omits the deleted newline from clipboard text.
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('second');
    expect(await readAll(page, editor)).toBe('first\nlast');
    await page.keyboard.press('Control+z');
    expect(await readAll(page, editor)).toBe('first\nsecond\nlast');
  });

  test(`copy_remains_text (${preset})`, async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await page.getByRole('combobox', { name: 'Keymap' }).selectOption(preset);
    await paste(editor, 'plain code');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('plain code');
    expect(await readAll(page, editor)).toBe('plain code');
  });

  test(`tab_escape_leaves_editor (${preset})`, async ({ page }) => {
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await page.getByRole('combobox', { name: 'Keymap' }).selectOption(preset);
    await paste(editor, 'alpha\nbeta');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Tab');
    expect(await readAll(page, editor)).toBe('  alpha\n  beta');
    await page.keyboard.press('Shift+Tab');
    expect(await readAll(page, editor)).toBe('alpha\nbeta');
    await page.keyboard.press('Control+z');
    expect(await readAll(page, editor)).toBe('  alpha\n  beta');
    await page.keyboard.press(preset === 'intellij' ? 'Control+Shift+Z' : 'Control+y');
    expect(await readAll(page, editor)).toBe('alpha\nbeta');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await expect(editor).not.toBeFocused();
  });

  test(`duplicate, move and Plain Text comment commands (${preset})`, async ({ page }) => {
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await page.getByRole('combobox', { name: 'Keymap' }).selectOption(preset);
    await paste(editor, 'alpha\nbeta');
    await page.keyboard.press('Control+Home');
    await page.keyboard.press(preset === 'intellij' ? 'Control+d' : 'Shift+Alt+ArrowDown');
    expect(await readAll(page, editor)).toBe('alpha\nalpha\nbeta');

    await paste(editor, 'first\nsecond\nthird');
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(preset === 'intellij' ? 'Shift+Alt+ArrowDown' : 'Alt+ArrowDown');
    expect(await readAll(page, editor)).toBe('first\nthird\nsecond');
    await page.keyboard.press('Control+End');
    await page.keyboard.press(preset === 'intellij' ? 'Shift+Alt+ArrowUp' : 'Alt+ArrowUp');
    expect(await readAll(page, editor)).toBe('first\nsecond\nthird');
    await page.keyboard.press('Control+/');
    expect(await readAll(page, editor)).toBe('first\nsecond\nthird');
  });
}
