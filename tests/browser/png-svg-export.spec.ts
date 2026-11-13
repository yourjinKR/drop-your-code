import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function downloadImage(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  const path = await download.path();
  return { bytes: await readFile(path), download, filename: download.suggestedFilename() };
}

test('downloads PNG and standalone SVG with the preview styling at 320px', async ({ page, context }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText('const example = "한글 👩‍💻";');
  await page.getByText('Window', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('example / code');
  await page.getByText('Background', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Transparent' }).check();
  await page.locator('summary').getByText('Export', { exact: true }).click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await expect(format).toHaveValue('png');
  await expect(page.getByText('Snapshot size 416 × 211 px')).toBeVisible();
  await expect(page.getByText('2× output 832 × 422 px')).toBeVisible();

  const png = await downloadImage(page);
  expect(png.filename).toBe('example _ code.png');
  expect(png.bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  const sample = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const at = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    const pixels = ctx.getImageData(145, 230, 74, 35).data;
    const hasKeyword = pixels.some((red, i) => i % 4 === 0 && red === 215 && pixels[i + 1] === 169 && pixels[i + 2] === 240);
    return { width: canvas.width, height: canvas.height, corner: at(0, 0), shadow: at(416, 332),
      window: at(416, 300), hasKeyword };
  }, png.bytes.toString('base64'));
  expect(sample).toMatchObject({ width: 832, height: 422, corner: [0, 0, 0, 0], window: [29, 31, 36, 255], hasKeyword: true });
  expect(sample.shadow[3]).toBeGreaterThan(0);
  expect(sample.shadow[3]).toBeLessThan(255);
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Download started.');

  await format.selectOption('svg');
  await expect(page.getByText('SVG uses the snapshot size.')).toBeVisible();
  await page.getByRole('tab', { name: 'Preview' }).click();
  const preview = page.getByRole('img', { name: 'Code snapshot' });
  await expect(preview).toBeVisible();
  const svg = await downloadImage(page);
  expect(svg.filename).toBe('example _ code.svg');
  const source = svg.bytes.toString();
  expect(source).toBe(await preview.evaluate(async (image: HTMLImageElement) => (await fetch(image.src)).text()));

  const reopened = await context.newPage();
  const savedPath = testInfo.outputPath(svg.filename);
  const requests: string[] = [];
  reopened.on('request', (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  // Playwright stores downloads under an opaque name. Preserve the SVG extension when reopening it.
  await svg.download.saveAs(savedPath);
  await reopened.goto(pathToFileURL(savedPath).href);
  const root = reopened.locator('svg');
  await expect(root).toHaveAttribute('viewBox', '0 0 416 211');
  await expect(root.locator('.code-row')).toContainText('const example');
  await expect(root.locator('[font-family]').last()).toHaveAttribute('font-family', /monospace$/);
  await expect(reopened.locator('parsererror, image, foreignObject, [href]')).toHaveCount(0);
  const fallbackWidth = await root.locator('.code-row text').first().evaluate((text: SVGTextElement) => {
    text.setAttribute('font-family', '"Drop Your Code test missing font", monospace');
    return text.getComputedTextLength();
  });
  expect(fallbackWidth).toBeGreaterThan(0);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('exports all 300 lines and the long row from either mode regardless of scroll and zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const first = `FIRST_LINE_MARKER${'x'.repeat(178)}RIGHT_EDGE_MARKER`;
  const code = [first, ...Array.from({ length: 298 }, (_, i) => `line ${i + 2}`), 'LAST_LINE_MARKER', ''].join('\n');
  await editor.focus();
  await page.keyboard.insertText(code);
  await editor.press('Control+End');
  const scroller = page.locator('.cm-scroller');
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(500);
  const before = await downloadImage(page);

  await page.locator('summary').getByText('Export', { exact: true }).click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await format.selectOption('svg');
  const svg = await downloadImage(page);
  const samples = await page.evaluate(({ source }) => {
    const root = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
    const rows = [...root.querySelectorAll('.code-row')];
    const transform = root.querySelector('g[transform]')!.getAttribute('transform')!;
    const [x, y] = transform.match(/\d+/g)!.map(Number);
    const firstRows = rows.slice(0, 2).map((row) => row.textContent).join('');
    const last = rows.at(-2)!.querySelector('text')!;
    const second = rows[1]!.querySelector('text')!;
    return { firstRows, last: last.textContent, blank: rows.at(-1)!.textContent,
      width: Number(root.getAttribute('width')), height: Number(root.getAttribute('height')),
      bottomY: y! + Number(last.getAttribute('y')), rightY: y! + Number(second.getAttribute('y')),
      leftX: x! + Number(last.getAttribute('x')) };
  }, { source: svg.bytes.toString() });
  expect(samples).toMatchObject({ firstRows: first, last: 'LAST_LINE_MARKER', blank: '' });

  const raster = await page.evaluate(async ({ base64, bottomY, rightY, leftX }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const hasText = (x: number, y: number, width: number) => ctx.getImageData(x * 2, (y - 14) * 2, width * 2, 28).data
      .some((red, i) => i % 4 === 0 && red > 200);
    return { width: canvas.width, height: canvas.height, bottom: hasText(leftX, bottomY, 125), right: hasText(750, rightY, 75) };
  }, { base64: before.bytes.toString('base64'), ...samples });
  expect(raster).toEqual({ width: samples.width * 2, height: samples.height * 2, bottom: true, right: true });

  await format.selectOption('png');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.getByRole('img', { name: 'Code snapshot' })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('region', { name: 'Snapshot canvas' }).evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect((await downloadImage(page)).bytes.equals(before.bytes)).toBe(true);
});

test('measures click-to-download for 200 JavaScript lines on the production build', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText(Array.from({ length: 200 }, (_, i) => `const item${i} = { value: ${i} };`).join('\n'));
  await page.locator('summary').getByText('Export', { exact: true }).click();
  await expect(page.getByText(/^2× output \d/)).toBeVisible();

  const results: number[] = [];
  for (let run = 0; run < 5; run++) {
    const started = performance.now();
    const [download] = await Promise.all([
      page.waitForEvent('download'), page.getByRole('button', { name: 'Export', exact: true }).click(),
    ]);
    results.push(Math.round(performance.now() - started));
    expect(await download.failure()).toBeNull();
  }
  await testInfo.attach('export time (ms)', { body: JSON.stringify(results), contentType: 'application/json' });
  console.log(`200-line PNG click to download (ms) ${results.join(', ')}`);
});
