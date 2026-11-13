import { expect, test } from '@playwright/test';

test('the editor fits short code and grows in both directions without replacing its view', async ({ page }) => {
  await page.goto('/');
  const frame = page.locator('.code-window');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await expect(frame).toHaveCSS('width', '320px');
  const original = await editor.elementHandle();
  const initialHeight = (await frame.boundingBox())!.height;
  await editor.focus();
  await page.keyboard.insertText(`${'wide'.repeat(18)}\nsecond\nthird`);
  await expect.poll(async () => (await frame.boundingBox())!.width).toBeGreaterThan(500);
  await expect.poll(async () => (await frame.boundingBox())!.height).toBeGreaterThan(initialHeight + 40);
  await editor.press('Control+Home');
  await editor.press('Shift+End');
  expect(await page.evaluate(() => getSelection()?.toString())).toBe('wide'.repeat(18));
  expect(await editor.evaluate((element, first) => element === first, original)).toBe(true);
  await editor.press('Control+z');
  await expect(frame).toHaveCSS('width', '320px');
  await expect.poll(async () => (await frame.boundingBox())!.height).toBe(initialHeight);
});

test('a narrow editor scrolls through 300 lines and wraps only when requested', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await editor.focus();
  await page.keyboard.insertText(`${'long line '.repeat(110)}\n${Array.from({ length: 299 }, (_, index) => `line ${index + 2}`).join('\n')}`);
  await editor.press('Control+Home');
  const scroller = page.locator('.cm-scroller');
  const overflowX = () => scroller.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  await expect.poll(overflowX).toBe(true);
  await page.getByRole('checkbox', { name: 'Wrap lines' }).check();
  await expect.poll(overflowX).toBe(false);
  await editor.press('Control+End');
  await expect(editor.getByText('line 300', { exact: true })).toBeInViewport();
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(1000);
});
