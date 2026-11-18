import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function clipboardImage(page: Page) {
  return page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const item = items.find(({ types }) => types.includes('image/png'))!;
    const png = await item.getType('image/png');
    const image = await createImageBitmap(png);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      return { type: png.type, width: canvas.width, height: canvas.height,
        outer: Array.from(ctx.getImageData(0, 0, 1, 1).data), inner: Array.from(ctx.getImageData(832, 600, 1, 1).data) };
    } finally {
      image.close();
    }
  });
}

test('copies transparent PNG from Editor with JPG selected and uses the latest document', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByText('Background', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Transparent' }).check();
  await page.getByRole('button', { name: 'Export settings' }).click();
  await page.getByRole('combobox', { name: 'Format' }).selectOption('jpg');
  await page.getByLabel('JPG background').fill('#ff0000');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.getByRole('img', { name: 'Code snapshot' })).toBeVisible();
  await page.getByRole('tab', { name: 'Editor' }).click();

  await page.evaluate(() => {
    const load = document.fonts.load.bind(document.fonts);
    document.fonts.load = async (...args) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      return load(...args);
    };
  });
  const code = 'first line\nsecond line\nthird line';
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await editor.focus();
  await page.keyboard.insertText(code);
  await page.getByRole('button', { name: 'Copy Image' }).click();
  const copying = page.getByRole('button', { name: 'Copying…' });
  await expect(copying).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Image copied.');
  expect(await clipboardImage(page)).toEqual({ type: 'image/png', width: 1664, height: 1012,
    outer: [0, 0, 0, 0], inner: [29, 31, 36, 255] });

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(code);
});

test('opens Export settings by keyboard and copies 4× PNG on a narrow screen', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText('const highQuality = true;');
  await page.getByText('Background', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Transparent' }).check();
  await page.getByRole('button', { name: 'Collapse Properties' }).click();
  const settings = page.getByRole('button', { name: 'Export settings' });
  const format = page.getByRole('combobox', { name: 'Format' });
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await settings.press('Enter');
  await expect(settings).toHaveAttribute('aria-expanded', 'true');
  const panel = await page.getByRole('group', { name: 'Export settings' }).boundingBox();
  expect(panel?.x).toBeGreaterThanOrEqual(0);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press('Tab');
  await expect(format).toBeFocused();
  await format.selectOption('svg');
  await format.press('Escape');
  await expect(format).toBeHidden();
  await expect(settings).toBeFocused();

  await settings.click();
  await expect(format).toHaveValue('svg');
  await page.getByRole('button', { name: 'Copy Image', exact: true }).click();
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Image copied.');
  expect(await clipboardImage(page)).toEqual({ type: 'image/png', width: 1664, height: 844,
    outer: [0, 0, 0, 0], inner: [29, 31, 36, 255] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('shows a PNG download fallback when clipboard permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.clipboard.write = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy Image' }).click();
  await expect(page.getByRole('alert')).toHaveText('Could not copy the image. Export a PNG instead.');
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('');
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('untitled.png');
  expect((await readFile(await download.path())).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('previews, downloads four formats, and copies PNG offline once the language is loaded', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.waitForLoadState('networkidle');

  const requests: string[] = [];
  context.on('request', (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  await context.setOffline(true);
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText('const offlineSnapshot = true;');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.getByRole('img', { name: 'Code snapshot' })).toBeVisible();
  const settings = page.getByRole('button', { name: 'Export settings' });
  const format = page.getByRole('combobox', { name: 'Format' });
  for (const type of ['png', 'svg', 'jpg', 'webp']) {
    await settings.click();
    await format.selectOption(type);
    const [download] = await Promise.all([
      page.waitForEvent('download'), page.getByRole('button', { name: 'Export', exact: true }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(`untitled.${type}`);
    expect(await download.failure()).toBeNull();
  }
  await page.getByRole('button', { name: 'Copy Image' }).click();
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Image copied.');
  expect(await clipboardImage(page)).toMatchObject({ type: 'image/png', width: 1664, height: 844 });
  expect(requests).toEqual([]);
});
