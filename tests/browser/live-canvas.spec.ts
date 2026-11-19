import { expect, test } from '@playwright/test';

test('pans and zooms the canvas while keeping editor selection, pointer input and Undo', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  const window = page.locator('.code-window');
  const zoom = page.getByLabel('Canvas zoom');
  const initialTime = new Date();
  await page.clock.setFixedTime(initialTime);
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(zoom).toHaveText('100%');
  const original = await editor.elementHandle();
  await editor.focus();
  await page.keyboard.insertText('const value = 1;');
  await editor.press('Control+a');

  const before = (await window.boundingBox())!;
  const space = (await canvas.boundingBox())!;
  await page.mouse.move(space.x + 32, space.y + 60);
  await page.mouse.down();
  await page.mouse.move(space.x + 82, space.y + 95, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await window.boundingBox())!.x - before.x)).toBe(50);
  const pan = page.getByRole('button', { name: 'Pan mode' });
  await pan.click();
  const frame = (await window.boundingBox())!;
  await page.mouse.move(frame.x + 80, frame.y + 68);
  await page.mouse.down();
  await page.mouse.move(frame.x + 100, frame.y + 40, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await window.boundingBox())!.x - frame.x)).toBe(20);

  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(pan).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => Math.round((await window.boundingBox())!.x)).toBe(Math.round(before.x));
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(zoom).toHaveText('125%');
  await page.getByRole('button', { name: 'Focus editor' }).click();
  await expect(editor).toBeFocused();
  expect(await page.evaluate(() => getSelection()?.toString())).toBe('const value = 1;');
  expect(await editor.evaluate((element, first) => element === first, original)).toBe(true);

  const line = editor.locator('.cm-line');
  const end = await line.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const bounds = range.getBoundingClientRect();
    return { x: bounds.right + 3, y: bounds.top + bounds.height / 2 };
  });
  await page.mouse.click(end.x, end.y);
  // Keep the two edits outside CodeMirror's typing history group on every browser.
  await page.clock.setFixedTime(new Date(initialTime.getTime() + 1000));
  await page.keyboard.type(' // edit');
  await expect(line).toHaveText('const value = 1; // edit');
  await editor.press('Control+z');
  await expect(line).toHaveText('const value = 1;');
  await canvas.evaluate((element) => element.scrollTo(0, 0));
  await expect(line).not.toBeInViewport();
  await page.getByRole('button', { name: 'Focus editor' }).click();
  await expect(line).toBeInViewport();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(zoom).toHaveText('88%');
  await expect(window).toBeInViewport({ ratio: 0.95 });
});

test('fits a tall document in the live canvas and scrolls to the caret when editing', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  const composition = page.locator('.canvas-composition');
  const zoom = page.getByLabel('Canvas zoom');
  await editor.focus();
  await page.keyboard.insertText(Array.from({ length: 300 }, (_, index) => `line ${index + 1}`).join('\n'));
  await editor.press('Control+End');
  await expect(editor.getByText('line 300', { exact: true })).toBeInViewport();
  const dimensions = await page.locator('.canvas-dimensions').innerText();
  const initialZoom = await zoom.innerText();
  await page.getByRole('button', { name: 'Fit' }).click();
  await expect(zoom).not.toHaveText(initialZoom);
  const bounds = (await canvas.boundingBox())!;
  const fitted = (await composition.boundingBox())!;
  expect(fitted.width).toBeLessThan(bounds.width);
  expect(fitted.height).toBeLessThan(bounds.height);
  expect(fitted.y).toBeGreaterThanOrEqual(bounds.y);
  await expect(page.locator('.canvas-dimensions')).toHaveText(dimensions);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(zoom).toHaveText(initialZoom);
  await page.getByRole('button', { name: 'Focus editor' }).click();
  await editor.press('Control+Home');
  await expect(editor.getByText('line 1', { exact: true })).toBeInViewport();
  await editor.press('Control+z');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('1 line');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('grows the window and follows an offscreen caret at the current zoom', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  const frame = page.locator('.code-window');
  const scroller = page.locator('.cm-scroller');
  const zoom = page.getByLabel('Canvas zoom');
  const dimensions = page.locator('.canvas-dimensions');
  const initialDimensions = await dimensions.innerText();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(zoom).toHaveText('125%');

  await editor.focus();
  const code = [...Array.from({ length: 70 }, (_, index) => `line ${index + 1}`), `${'x'.repeat(260)} RIGHT_EDGE`].join('\n');
  await page.keyboard.insertText(code);
  await expect.poll(() => frame.evaluate((element) => element.clientWidth)).toBeGreaterThan(2100);
  await expect.poll(() => frame.evaluate((element) => element.clientHeight)).toBeGreaterThan(1400);
  await expect(zoom).toHaveText('125%');
  await expect.poll(() => editor.evaluate((element) => {
    const selection = getSelection();
    if (!selection?.focusNode || !element.contains(selection.focusNode) || !selection.isCollapsed) return false;
    const caret = selection.getRangeAt(0).getBoundingClientRect();
    const viewport = element.closest('.canvas-viewport')!.getBoundingClientRect();
    return caret.height > 0 && caret.left >= viewport.left - 1 && caret.right <= viewport.right + 1 &&
      caret.top >= viewport.top - 1 && caret.bottom <= viewport.bottom + 1;
  })).toBe(true);
  expect(await scroller.evaluate((element) => ({ x: element.scrollLeft, y: element.scrollTop }))).toEqual({ x: 0, y: 0 });
  expect(await canvas.evaluate((element) => element.scrollLeft)).toBeGreaterThan(500);

  const expanded = await dimensions.innerText();
  await page.getByRole('button', { name: 'Fit' }).click();
  await expect(zoom).not.toHaveText('125%');
  const fittedZoom = await zoom.innerText();
  const viewport = (await canvas.boundingBox())!;
  const fitted = (await frame.boundingBox())!;
  expect(fitted.width).toBeLessThan(viewport.width);
  expect(fitted.height).toBeLessThan(viewport.height);
  await expect(dimensions).toHaveText(expanded);
  await page.getByRole('button', { name: 'Focus editor' }).click();
  await editor.press('ControlOrMeta+a');
  await editor.press('Backspace');
  await expect(frame).toHaveCSS('width', '320px');
  await expect(dimensions).toHaveText(initialDimensions);
  await expect(zoom).toHaveText(fittedZoom);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(420);
});
