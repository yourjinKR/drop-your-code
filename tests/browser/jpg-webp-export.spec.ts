import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const webpUnavailable = 'WebP export is unavailable in this browser. Choose another format.';

async function readExport(page: Page, format: string) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`untitled.${format}`);
  return readFile(await download.path());
}

async function readPixels(page: Page, bytes: Buffer, mime: string, points: [number, number][]) {
  return page.evaluate(async ({ base64, mime, points }) => {
    const image = new Image();
    image.src = `data:${mime};base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height,
      pixels: points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data)) };
  }, { base64: bytes.toString('base64'), mime, points });
}

function expectColor(pixel: number[], target: number[], tolerance: number) {
  expect(pixel[3]).toBe(255);
  target.forEach((channel, index) => expect(Math.abs(pixel[index]! - channel)).toBeLessThanOrEqual(tolerance));
}

test('JPG preview and export composite the chosen color and preserve opaque snapshot backgrounds', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Background', { exact: true }).click();
  const transparent = page.getByRole('checkbox', { name: 'Transparent' });
  await transparent.check();
  await page.locator('summary').getByText('Export', { exact: true }).click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await format.selectOption('jpg');
  const jpgBackground = page.getByLabel('JPG background');
  await expect(jpgBackground).toHaveValue('#ffffff');
  await jpgBackground.fill('#f4d2a0');
  await page.getByRole('tab', { name: 'Preview' }).click();
  const preview = page.getByRole('img', { name: 'Code snapshot' });
  await expect(preview).toHaveCSS('background-color', 'rgb(244, 210, 160)');
  const points: [number, number][] = [[12, 12], [416, 332], [416, 300]];
  const jpg = await readExport(page, 'jpg');
  expect(jpg.subarray(0, 3).toString('hex')).toBe('ffd8ff');
  const decoded = await readPixels(page, jpg, 'image/jpeg', points);
  expect(decoded).toMatchObject({ width: 832, height: 422 });
  expectColor(decoded.pixels[0]!, [244, 210, 160], 5);
  expectColor(decoded.pixels[1]!, [211, 181, 138], 14);
  expectColor(decoded.pixels[2]!, [29, 31, 36], 5);

  await format.selectOption('webp');
  await expect(jpgBackground).toHaveCount(0);
  await expect(transparent).toBeChecked();
  await expect(preview).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await format.selectOption('jpg');
  await expect(jpgBackground).toHaveValue('#f4d2a0');
  await transparent.uncheck();
  await page.getByLabel('Color', { exact: true }).fill('#32465e');
  const opaque = await readPixels(page, await readExport(page, 'jpg'), 'image/jpeg', [[12, 12]]);
  expectColor(opaque.pixels[0]!, [50, 70, 94], 5);
});

test('WebP preserves alpha and the final row of a 300-line snapshot when the encoder is available', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Background', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Transparent' }).check();
  await page.locator('summary').getByText('Export', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Format' }).selectOption('webp');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText([...Array.from({ length: 299 }, (_, index) => `line ${index + 1}`), 'ZZZZZZZZZZZZZZZZ'].join('\n'));
  const supportsWebp = await page.evaluate(() => new Promise((resolve) => {
    document.createElement('canvas').toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp');
  }));
  if (!supportsWebp) {
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(webpUnavailable);
    return;
  }
  const webp = await readExport(page, 'webp');
  expect(webp.toString('ascii', 0, 4)).toBe('RIFF');
  expect(webp.toString('ascii', 8, 12)).toBe('WEBP');
  const height = (96 + 46 + 48 + 300 * 21) * 2;
  const bottom: [number, number][] = Array.from({ length: 20 * 20 }, (_, i) => [146 + i % 20, height - 185 + Math.floor(i / 20)]);
  const decoded = await readPixels(page, webp, 'image/webp', [[0, 0], [416, height - 90], [416, 300], ...bottom]);
  expect(decoded).toMatchObject({ width: 832, height });
  const [corner, shadow, window, ...lastLine] = decoded.pixels;
  expect(corner![3]).toBe(0);
  expect(shadow![3]).toBeGreaterThan(0);
  expect(shadow![3]).toBeLessThan(255);
  expect(window![3]).toBe(255);
  expect(lastLine.some((pixel) => pixel[0]! > 170)).toBe(true);
});

test('reports WebP MIME fallback without downloading and allows PNG recovery', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      original.call(this, callback, type === 'image/webp' ? 'image/png' : type, quality);
    };
  });
  await page.goto('/');
  await page.locator('summary').getByText('Export', { exact: true }).click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await format.selectOption('webp');
  const downloads: string[] = [];
  page.on('download', (file) => downloads.push(file.suggestedFilename()));
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(webpUnavailable);
  await format.selectOption('png');
  const png = await readExport(page, 'png');
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(downloads).toEqual(['untitled.png']);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
