import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Use the file save handler in Firefox so Playwright can read the exported bytes.
test.use({ launchOptions: { firefoxUserPrefs: { 'browser.download.viewableInternally.enabledTypes': '' } } });

const paletteShortcut = 'ControlOrMeta+Shift+Period';

function commandPalette(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'All Commands' });
  return { dialog, search: dialog.getByRole('combobox', { name: 'Search commands' }) };
}

function languagePalette(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Change Language' });
  return { dialog, search: dialog.getByRole('combobox', { name: 'Search languages' }) };
}

async function openWorkspace(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Commands', exact: true })).toBeVisible();
}

async function runCommand(page: Page, query: string) {
  await page.keyboard.press(paletteShortcut);
  const { search } = commandPalette(page);
  await search.fill(query);
  await search.press('Enter');
}

test('opens from the editor, canvas, and Properties and restores focus', async ({ page }) => {
  await openWorkspace(page);
  const isMac = await page.evaluate(() => navigator.platform.startsWith('Mac'));
  await expect(page.getByRole('button', { name: 'Commands', exact: true }))
    .toHaveAttribute('aria-keyshortcuts', isMac ? 'Meta+Shift+.' : 'Control+Shift+.');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  const language = page.getByRole('combobox', { name: 'Language', exact: true });
  const { dialog, search } = commandPalette(page);
  await editor.focus();
  await page.keyboard.insertText('const selected = true;');
  await editor.press('ControlOrMeta+a');

  for (const origin of [editor, canvas, language]) {
    await origin.focus();
    await page.keyboard.press(paletteShortcut);
    await expect(search).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(origin).toBeFocused();
    if (origin === editor) {
      expect(await page.evaluate(() => getSelection()?.toString())).toBe('const selected = true;');
    }
  }

  await expect(editor).toHaveText('const selected = true;');
  await editor.press('ControlOrMeta+z');
  await expect(editor).toHaveText('');
});

test('leaves the former P shortcuts to the browser', async ({ page }) => {
  await openWorkspace(page);
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  await canvas.focus();
  // A synthetic event lets us check cancellation without opening browser chrome.
  const uncanceled = await canvas.evaluate((element) => {
    const isMac = navigator.platform.startsWith('Mac');
    return [false, true].map((shiftKey) => element.dispatchEvent(new KeyboardEvent('keydown', {
      key: shiftKey ? 'P' : 'p',
      code: 'KeyP',
      ctrlKey: !isMac,
      metaKey: isMac,
      shiftKey,
      bubbles: true,
      cancelable: true,
    })));
  });
  expect(uncanceled).toEqual([true, true]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(canvas).toBeFocused();
});

test('uses Meta and exposes the matching shortcut on macOS', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
  });
  await openWorkspace(page);
  await expect(page.getByRole('button', { name: 'Commands', exact: true }))
    .toHaveAttribute('aria-keyshortcuts', 'Meta+Shift+.');
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  await canvas.focus();
  const uncanceled = await canvas.evaluate((element) => [
    { ctrlKey: true },
    { metaKey: true },
  ].map((modifier) => element.dispatchEvent(new KeyboardEvent('keydown', {
    key: '>',
    code: 'Period',
    shiftKey: true,
    bubbles: true,
    cancelable: true,
    ...modifier,
  }))));
  expect(uncanceled).toEqual([true, false]);
  await expect(commandPalette(page).search).toBeFocused();
});

test('restores focus to Commands when the opener is hidden', async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole('button', { name: 'Export settings' }).click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await format.focus();
  await page.keyboard.press(paletteShortcut);
  const { dialog, search } = commandPalette(page);
  await expect(search).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(format).toBeHidden();
  await expect(page.getByRole('button', { name: 'Commands', exact: true })).toBeFocused();
});

test('uses language aliases, direct commands, and the shared current language', async ({ page }) => {
  await openWorkspace(page);
  const select = page.getByRole('combobox', { name: 'Language', exact: true });
  const status = page.getByRole('status', { name: 'Editor status' });
  const { dialog, search } = languagePalette(page);
  const all = commandPalette(page);

  await page.keyboard.press(paletteShortcut);
  await expect(all.dialog.getByRole('option', { name: 'Set Language: Plain Text', exact: true })).toContainText('Current');
  await all.search.fill('PY');
  await expect(all.dialog.getByRole('option', { name: 'Set Language: Python', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  await all.search.press('Enter');
  await expect(status).toContainText('Python');
  await expect(select).toHaveValue('python');

  await runCommand(page, 'set language java');
  await expect(status).toContainText('Java');
  await expect(select).toHaveValue('java');

  await page.getByRole('button', { name: 'Commands', exact: true }).click();
  await all.dialog.getByRole('option', { name: 'Change Language', exact: true }).click();
  await expect(search).toBeFocused();
  await expect(dialog.getByRole('option', { name: 'Java', exact: true })).toContainText('Current');
  await search.fill('ts');
  await dialog.getByRole('option', { name: 'TypeScript', exact: true }).click();
  await expect(status).toContainText('TypeScript');
  await expect(select).toHaveValue('typescript');

  await runCommand(page, 'plain text');
  await expect(status).toContainText('Plain Text');
  await expect(select).toHaveValue('plaintext');
});

test('contains modal focus and scrolls the active result at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 420 });
  await openWorkspace(page);
  const trigger = page.getByRole('button', { name: 'Commands', exact: true });

  await trigger.click();
  const { dialog, search } = commandPalette(page);
  await expect(search).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Close palette' })).toBeVisible();
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThan(0);
  expect(bounds.x + bounds.width).toBeLessThan(320);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(420);

  const scrolling = page.locator('html');
  await expect(scrolling).toHaveCSS('overflow-y', 'hidden');
  await page.locator('#keymap').evaluate((keymap: HTMLElement) => keymap.focus());
  await expect(search).toBeFocused();
  for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }

  await dialog.getByRole('button', { name: 'Browse languages' }).click();
  const languages = languagePalette(page);
  const options = languages.dialog.getByRole('option');
  await expect(options).toHaveCount(14);
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  for (let index = 1; index < 14; index++) await languages.search.press('ArrowDown');
  await expect(options.last()).toHaveAttribute('aria-selected', 'true');
  await expect(options.last()).toBeInViewport();
  await languages.search.press('ArrowUp');
  await expect(options.nth(12)).toHaveAttribute('aria-selected', 'true');

  await languages.search.fill('no-such-language');
  await expect(options).toHaveCount(0);
  await expect(languages.dialog.getByRole('status')).toContainText('No results.');
  await languages.search.press('Enter');
  await expect(languages.dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(languages.dialog).toBeHidden();
  await expect(scrolling).not.toHaveCSS('overflow-y', 'hidden');
  await expect(trigger).toBeFocused();
});

test('ignores composition and repeated open shortcuts and toggles line numbers', async ({ page }) => {
  await openWorkspace(page);
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const numbers = page.getByRole('checkbox', { name: 'Line numbers' });
  const gutter = page.locator('.cm-lineNumbers');
  const { dialog, search } = commandPalette(page);

  await editor.focus();
  const isMac = await page.evaluate(() => navigator.platform.startsWith('Mac'));
  const shortcutEvent = { key: '>', code: 'Period', ctrlKey: !isMac, metaKey: isMac, shiftKey: true };
  await editor.dispatchEvent('keydown', { ...shortcutEvent, isComposing: true });
  await expect(dialog).toBeHidden();
  await editor.dispatchEvent('keydown', { ...shortcutEvent, repeat: true });
  await expect(dialog).toBeHidden();

  await page.keyboard.press(paletteShortcut);
  await search.fill('line numbers');
  await expect(dialog.getByRole('option', { name: 'Toggle Line Numbers', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  for (const key of ['Enter', 'Escape']) {
    await search.dispatchEvent('keydown', { key, isComposing: true });
    await expect(dialog).toBeVisible();
  }
  await search.dispatchEvent('compositionstart');
  for (const key of ['Enter', 'Escape']) {
    await page.keyboard.press(key);
    await expect(dialog).toBeVisible();
  }
  await search.dispatchEvent('compositionend');
  await search.dispatchEvent('keydown', { ...shortcutEvent, repeat: true });
  await expect(search).toHaveValue('line numbers');
  await search.press('Enter');
  await expect(numbers).toBeChecked();
  await expect(gutter).toBeVisible();
  await runCommand(page, 'line numbers');
  await expect(numbers).not.toBeChecked();
  await expect(gutter).toHaveCount(0);
});

test('reuses syntax theme, keymap, Properties, canvas reset, and editor focus actions', async ({ page }) => {
  await openWorkspace(page);
  await runCommand(page, 'change syntax theme');
  const themes = page.getByRole('dialog', { name: 'Change Syntax Theme' });
  await themes.getByRole('option', { name: 'IntelliJ Light', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Syntax theme' })).toHaveValue('light');
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();

  await runCommand(page, 'toggle properties');
  await expect(page.getByRole('complementary', { name: 'Properties' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Show Properties' })).toBeFocused();
  await runCommand(page, 'toggle properties');
  await expect(page.getByRole('button', { name: 'Collapse Properties' })).toBeFocused();

  const pan = page.getByRole('button', { name: 'Pan mode' });
  const zoom = page.getByLabel('Canvas zoom');
  const initialZoom = await zoom.innerText();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(zoom).not.toHaveText(initialZoom);
  await pan.click();
  await expect(pan).toHaveAttribute('aria-pressed', 'true');
  await runCommand(page, 'reset canvas view');
  await expect(zoom).toHaveText(initialZoom);
  await expect(pan).toHaveAttribute('aria-pressed', 'false');

  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const keymap = page.getByRole('combobox', { name: 'Keymap', exact: true });
  await runCommand(page, 'focus editor');
  await expect(editor).toBeFocused();
  await page.keyboard.insertText('first\nsecond');
  for (const [label, id, shortcut] of [
    ['VS Code', 'vscode', 'ControlOrMeta+Shift+K'],
    ['IntelliJ', 'intellij', 'Control+y'],
  ] as const) {
    await runCommand(page, 'change keymap');
    const keymaps = page.getByRole('dialog', { name: 'Change Keymap' });
    await keymaps.getByRole('option', { name: label, exact: true }).click();
    await expect(keymap).toHaveValue(id);
    await expect(editor).toBeFocused();
    await editor.press(shortcut === 'Control+y' && process.platform === 'darwin' ? 'Meta+Backspace' : shortcut);
    await expect(editor.locator('.cm-line')).toHaveText(['first']);
    await editor.press('ControlOrMeta+z');
    await expect(editor.locator('.cm-line')).toHaveText(['first', 'second']);
  }
});

test('keeps the applied language when a palette request fails and retries from Properties', async ({ context, page }) => {
  await openWorkspace(page);
  const status = page.getByRole('status', { name: 'Editor status' });
  const select = page.getByRole('combobox', { name: 'Language', exact: true });
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await select.selectOption('python');
  await expect(status).toContainText('Python');
  await editor.focus();
  await page.keyboard.insertText('print("한글")');
  await page.getByRole('button', { name: 'Collapse Properties' }).click();

  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await runCommand(page, 'sh');
  await expect(page.getByRole('alert')).toContainText('Could not load Shell.');
  await expect(status).toContainText('Python');
  await expect(editor).toHaveText('print("한글")');

  await page.getByRole('button', { name: 'Show Properties' }).click();
  await expect(select).toHaveValue('python');
  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(status).toContainText('Shell');
  await expect(select).toHaveValue('shell');
  await expect(select).toBeFocused();
  await expect(editor).toHaveText('print("한글")');
});

test('downloads each explicit format and shares the normal output feedback', async ({ page }) => {
  await openWorkspace(page);
  const exportSettings = page.getByRole('button', { name: 'Export settings' });
  const format = page.getByRole('combobox', { name: 'Format' });
  await exportSettings.click();
  await format.selectOption('svg');
  await format.press('Escape');

  for (const type of ['png', 'svg', 'jpg', 'webp'] as const) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      runCommand(page, `export as ${type}`),
    ]);
    expect(download.suggestedFilename()).toBe(`untitled.${type}`);
    const bytes = await readFile(await download.path());
    if (type === 'png') expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    if (type === 'svg') expect(bytes.toString()).toContain('<svg ');
    if (type === 'jpg') expect(bytes.subarray(0, 3).toString('hex')).toBe('ffd8ff');
    if (type === 'webp') expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
    await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Download started.');
  }

  await exportSettings.click();
  await expect(format).toHaveValue('svg');
});

test('copies a PNG from the keyboard and reports clipboard feedback', async ({ browserName, context, page }) => {
  test.skip(browserName !== 'chromium', 'This check reads the PNG through Chromium clipboard permissions.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openWorkspace(page);
  await runCommand(page, 'copy image');
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Image copied.');
  await expect.poll(() => page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => item.types)))
    .toEqual(['image/png']);
});
