import { expect, test } from '@playwright/test';

test('shows an opaque code window with centered title and decorative local language icon', async ({ page }) => {
  await page.goto('/');
  const window = page.locator('.code-window');
  const title = window.getByText('untitled', { exact: true });
  await expect(title).toBeVisible();
  await expect(window.locator('.window-lights')).toHaveAttribute('aria-hidden', 'true');
  await expect(window.locator('.window-lights i')).toHaveCount(3);
  await expect(window.getByRole('button')).toHaveCount(0);
  await expect(window).toHaveCSS('background-color', 'rgb(29, 31, 36)');
  await expect(window).toHaveCSS('border-radius', '12px');
  const frame = await window.boundingBox();
  const text = await title.boundingBox();
  if (!frame || !text) throw new Error('Window and title should be visible');
  expect(Math.abs(frame.x + frame.width / 2 - text.x - text.width / 2)).toBeLessThan(1);
  await expect(window.locator('.code-window-title svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(window.locator('.lucide-file-code')).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('shell');
  await expect(window.locator('.lucide-terminal')).toBeVisible();
  await expect(title).toHaveText('untitled');
});

test('properties_toggle_preserves_editor_state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await editor.focus();
  await page.keyboard.insertText('first\nsecond');
  await editor.press('Control+Home');
  await editor.press('Shift+End');
  const original = await editor.elementHandle();
  const editorArea = page.locator('.workspace-editor');
  const dockedWidth = (await editorArea.boundingBox())?.width ?? 0;

  await editor.press('Escape');
  await editor.press('Tab');
  const collapse = page.getByRole('button', { name: 'Collapse Properties' });
  await expect(collapse).toBeFocused();
  await expect(collapse).toHaveCSS('outline-style', 'solid');
  await collapse.press('Enter');
  const show = page.getByRole('button', { name: 'Show Properties' });
  await expect(show).toBeFocused();
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveCount(0);
  expect((await editorArea.boundingBox())?.width).toBeGreaterThan(dockedWidth);
  await show.press('Space');
  await expect(collapse).toBeFocused();
  await expect(collapse).toHaveAttribute('aria-expanded', 'true');
  expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
  await editor.focus();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('first');
  await editor.press('Control+z');
  await expect(editor).toHaveText('');
});

test('all_visible_controls_have_english_names', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Focus editor', 'Switch to light mode', 'Collapse Properties']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  for (const name of ['Keymap', 'Language', 'Syntax theme']) {
    await expect(page.getByRole('combobox', { name, exact: true })).toBeVisible();
  }
  for (const name of ['Line numbers', 'Wrap lines']) {
    await expect(page.getByRole('checkbox', { name, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Focus editor' }).click();
  await expect(page.getByRole('textbox', { name: 'Code editor' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled();
  await expect(page.getByRole('button', { name: /history|copy image/i })).toHaveCount(0);
});

test('keeps keyboard focus visible in forced colors and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Export' })).toBeFocused();
  await page.keyboard.press('Tab');
  const focus = page.getByRole('button', { name: 'Focus editor' });
  await expect(focus).toBeFocused();
  await expect(focus).toHaveCSS('outline-style', 'solid');
  await expect(focus).toHaveCSS('outline-width', '2px');
  await expect(focus).toHaveCSS('transition-duration', '0s, 0s');
  await focus.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Code editor' })).toBeFocused();
  await expect(page.locator('.cm-editor')).toHaveCSS('outline-style', 'solid');
});

test('UI and syntax themes can be combined independently', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');
  const canvas = page.locator('.code-window');
  const syntax = page.getByRole('combobox', { name: 'Syntax theme' });
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText('const value = 3;');
  const keyword = canvas.getByText('const', { exact: true });

  await expect(root).toHaveCSS('color-scheme', 'dark');
  await expect(canvas).toHaveCSS('background-color', 'rgb(29, 31, 36)');
  await expect(keyword).toHaveCSS('color', 'rgb(215, 169, 240)');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(root).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f3f4f6');
  await expect(keyword).toHaveCSS('color', 'rgb(215, 169, 240)');
  await syntax.selectOption('light');
  await expect(root).toHaveCSS('color-scheme', 'light');
  await expect(canvas).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(keyword).toHaveCSS('color', 'rgb(116, 40, 148)');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(root).toHaveCSS('color-scheme', 'dark');
  await expect(canvas).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(keyword).toHaveCSS('color', 'rgb(116, 40, 148)');
});

test('wrap removes horizontal scrolling without changing logical lines on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const code = 'long_example '.repeat(90) + '\nlast line';
  await editor.focus();
  await page.keyboard.insertText(code);
  const scroller = page.locator('.cm-scroller');
  const horizontalOverflow = () => scroller.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  await expect.poll(horizontalOverflow).toBe(true);
  await page.getByRole('checkbox', { name: 'Line numbers' }).check();
  await expect(page.locator('.cm-lineNumbers')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Wrap lines' }).check();
  await expect.poll(horizontalOverflow).toBe(false);
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('2 lines');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByRole('checkbox', { name: 'Wrap lines' }).uncheck();
  await expect.poll(horizontalOverflow).toBe(true);
  expect((await editor.locator('.cm-line').allTextContents()).join('\n')).toBe(code);
});
