import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

async function paste(editor: Locator, code: string) {
  await editor.focus();
  await editor.evaluate((element, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  }, code);
}

test('Phase 1 editing, keymap, language, appearance and Undo work together with literal HTML', async ({ page, baseURL }) => {
  const external: string[] = [];
  const nonAssetRequests: string[] = [];
  const pageErrors: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseURL) external.push(request.url());
    if (request.method() !== 'GET' || request.postData() !== null) nonAssetRequests.push(request.url());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin === baseURL) await route.continue();
    else await route.abort();
  });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const status = page.getByRole('status', { name: 'Editor status' });
  const source = '<main title="한글"><script>document.body.dataset.fixtureRan = "yes"</script></main>';
  await paste(editor, source);
  await page.getByRole('combobox', { name: 'Keymap' }).selectOption('intellij');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('html');
  await expect(status).toContainText('HTML');
  await page.getByRole('combobox', { name: 'Syntax theme' }).selectOption('light');
  await page.getByRole('checkbox', { name: 'Line numbers' }).check();
  await page.getByRole('checkbox', { name: 'Wrap lines' }).check();
  await expect(editor.locator('.cm-line')).toHaveText(source);
  await expect(editor.locator('main, script')).toHaveCount(0);
  expect(await page.locator('body').getAttribute('data-fixture-ran')).toBeNull();
  await editor.press('Control+z');
  await expect(editor.locator('.cm-line')).toHaveText('');
  await editor.press('Control+Shift+z');
  await expect(editor.locator('.cm-line')).toHaveText(source);
  expect(external).toEqual([]);
  expect(nonAssetRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('300 lines stay editable with syntax highlighting, numbers and wrapping enabled', async ({ page }, testInfo) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await expect(editor).toBeVisible();
  const startup = await page.evaluate(() => {
    const now = performance.now();
    return { editorObservedMs: now, navigationDurationMs: performance.getEntriesByType('navigation')[0]?.duration };
  });
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('checkbox', { name: 'Line numbers' }).check();
  await page.getByRole('checkbox', { name: 'Wrap lines' }).check();
  const lines = Array.from({ length: 300 }, (_, index) => `const value${index} = "한글 ${index}";`);
  const startPaste = performance.now();
  await paste(editor, lines.join('\n'));
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('300 lines');
  const pasteToStatusMs = performance.now() - startPaste;
  await editor.press('Control+End');
  const editToPaintMs = await editor.evaluate(async (element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', ' // end');
    const start = performance.now();
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return performance.now() - start;
  });
  await expect(editor.getByText('// end', { exact: true })).toBeVisible();
  await editor.press('Control+z');
  await expect(editor.getByText('// end', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('300 lines');
  const timings = { ...startup, pasteToStatusMs, editToPaintMs };
  await testInfo.attach('local timings', { body: JSON.stringify(timings), contentType: 'application/json' });
  if (process.env['REPORT_EDITOR_TIMINGS'] === '1') console.log(JSON.stringify(timings));
});
