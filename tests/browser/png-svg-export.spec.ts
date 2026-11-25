import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { downloadImage } from './helpers/download';

test('downloads PNG and standalone SVG with VS Code Dark+ at 320px', async ({ page, context }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Syntax theme' }).selectOption({ label: 'VS Code Dark+' });
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText('const example = "한글 👩‍💻";');
  await page.getByText('Window', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('example / code');
  await page.getByRole('checkbox', { name: 'Show title' }).check();
  const settings = page.getByRole('button', { name: 'Export settings' });
  await settings.click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await expect(format).toHaveValue('png');
  await expect(page.getByText('Snapshot size 320 × 115 px')).toBeVisible();
  await expect(page.getByText('2× output 640 × 230 px')).toBeVisible();

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
    const pixels = ctx.getImageData(49, 134, 74, 35).data;
    const hasKeyword = pixels.some((red, i) => i % 4 === 0 && red === 86 && pixels[i + 1] === 156 && pixels[i + 2] === 214);
    return { width: canvas.width, height: canvas.height, corner: at(0, 0),
      headerEdge: at(0, 70), lastHeaderRow: at(200, 91), firstBodyRow: at(200, 92),
      bodyEdge: at(0, 130), light: at(42, 46), hasKeyword };
  }, png.bytes.toString('base64'));
  expect(sample).toEqual({ width: 640, height: 230, corner: [0, 0, 0, 0],
    headerEdge: [37, 37, 37, 255], lastHeaderRow: [37, 37, 37, 255], firstBodyRow: [30, 30, 30, 255],
    bodyEdge: [30, 30, 30, 255], light: [255, 95, 87, 255], hasKeyword: true });
  await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Download started.');

  await settings.click();
  await format.selectOption('svg');
  await expect(page.getByText('SVG uses the snapshot size.')).toBeVisible();
  await settings.press('Escape');
  await expect(page.locator('.canvas-composition')).toHaveAttribute('data-transparent', 'true');
  await expect(page.locator('.code-window-title')).toHaveText('example / code.js');
  const svg = await downloadImage(page);
  expect(svg.filename).toBe('example _ code.svg');

  const reopened = await context.newPage();
  const savedPath = testInfo.outputPath(svg.filename);
  const requests: string[] = [];
  reopened.on('request', (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  // Playwright stores downloads under an opaque name. Preserve the SVG extension when reopening it.
  await svg.download.saveAs(savedPath);
  await reopened.goto(pathToFileURL(savedPath).href);
  const root = reopened.locator('svg');
  await expect(root).toHaveAttribute('viewBox', '0 0 320 115');
  await expect(root.locator('#window-shadow')).toHaveCount(0);
  await expect(root.locator('[stroke]')).toHaveCount(0);
  await expect(root.locator('.window-title')).toHaveText('example / code.js');
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

test('preserves spaces and tab stops in downloaded and copied snapshots', async ({ browserName, context, page }) => {
  const lines = ['class  Probe {', '    void run() {', '        value.call("A  A");', ' \t  }', '}'];
  const cells = [
    { row: 0, column: 5, ink: false }, // two spaces after a highlighted keyword
    { row: 0, column: 6, ink: false },
    { row: 0, column: 7, ink: true },
    { row: 1, column: 8, ink: false }, // one space at a token boundary
    { row: 1, column: 9, ink: true },
    { row: 2, column: 0, ink: false }, // eight leading spaces
    { row: 2, column: 8, ink: true },
    { row: 2, column: 21, ink: false }, // two spaces within the string
    { row: 2, column: 22, ink: false },
    { row: 2, column: 23, ink: true },
    { row: 3, column: 0, ink: false }, // a space and tab reach column 2, then two more spaces
    { row: 3, column: 3, ink: false },
    { row: 3, column: 4, ink: true },
  ];
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('java');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('Java');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText(lines.join('\n'));
  const settings = page.getByRole('button', { name: 'Export settings' });
  const format = page.getByRole('combobox', { name: 'Format' });
  const supportsWebp = await page.evaluate(() => new Promise((resolve) => {
    document.createElement('canvas').toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp');
  }));
  const files = Object.entries({ svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' });
  const downloads = [];
  for (const [name, mime] of files) {
    if (name === 'webp' && !supportsWebp) continue;
    await settings.click();
    await format.selectOption(name);
    const { bytes } = await downloadImage(page);
    downloads.push({ name, url: `data:${mime};base64,${bytes.toString('base64')}` });
  }

  const readClipboard = browserName === 'chromium';
  if (readClipboard) {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy Image' }).click();
    await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Image copied.');
  }

  const result = await page.evaluate(async ({ downloads, cells, readClipboard }) => {
    const svgSource = await (await fetch(downloads[0]!.url)).text();
    const svg = new DOMParser().parseFromString(svgSource, 'image/svg+xml').documentElement;
    const rows = [...svg.querySelectorAll('.code-row')];
    const code = rows[0]!.parentElement!;
    const [frameX, frameY] = svg.querySelector('g[transform]')!.getAttribute('transform')!.match(/\d+/g)!.map(Number);
    const left = frameX! + Number(rows[0]!.querySelector('text')!.getAttribute('x'));
    const baselines = rows.map((row) => frameY! + Number(row.querySelector('text')!.getAttribute('y')));
    const width = Number(svg.getAttribute('width'));
    const font = `${code.getAttribute('font-size')}px ${code.getAttribute('font-family')}`;

    async function readCells(url: string) {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.font = font;
      const scale = canvas.width / width;
      const cellWidth = ctx.measureText('0').width;
      ctx.drawImage(image, 0, 0);
      return cells.map(({ row, column }) => {
        // Sample inside the cell to avoid neighboring glyph edges and compression artifacts.
        const x = Math.ceil((left + (column + 0.25) * cellWidth) * scale);
        const y = Math.round((baselines[row]! - 13) * scale);
        return ctx.getImageData(x, y, Math.ceil(cellWidth * 0.5 * scale), 16 * scale).data
          .some((red, index, rgba) => index % 4 === 0
            && 0.2126 * red + 0.7152 * rgba[index + 1]! + 0.0722 * rgba[index + 2]! > 125);
      });
    }

    const outputs = [];
    for (const { name, url } of downloads) outputs.push({ name, ink: await readCells(url) });
    if (readClipboard) {
      const items = await navigator.clipboard.read();
      const png = await items.find(({ types }) => types.includes('image/png'))!.getType('image/png');
      const url = URL.createObjectURL(png);
      try {
        outputs.push({ name: 'PNG clipboard', ink: await readCells(url) });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    return { outputs, sourceLines: rows.map((row) => row.textContent) };
  }, { downloads, cells, readClipboard });
  expect(result.sourceLines).toEqual(lines);
  for (const { name, ink } of result.outputs) {
    cells.forEach((cell, index) => {
      expect.soft(ink[index], `${name} line ${cell.row + 1}, column ${cell.column + 1}`).toBe(cell.ink);
    });
  }
});

test('exports all 300 lines and the long row regardless of canvas scroll and zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const first = `FIRST_LINE_MARKER${'x'.repeat(100)}RIGHT_EDGE_MARKER`;
  const code = [first, ...Array.from({ length: 298 }, (_, i) => `line ${i + 2}`), 'LAST_LINE_MARKER', ''].join('\n');
  await editor.focus();
  await page.keyboard.insertText(code);
  await editor.press('Control+End');
  const canvas = page.getByRole('region', { name: 'Snapshot canvas' });
  await expect(editor.getByText('LAST_LINE_MARKER', { exact: true })).toBeInViewport();
  const before = await downloadImage(page);

  const settings = page.getByRole('button', { name: 'Export settings' });
  await settings.click();
  const format = page.getByRole('combobox', { name: 'Format' });
  await format.selectOption('svg');
  const svg = await downloadImage(page);
  const samples = await page.evaluate(({ source }) => {
    const root = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
    const rows = [...root.querySelectorAll('.code-row')];
    const transform = root.querySelector('g[transform]')!.getAttribute('transform')!;
    const [x, y] = transform.match(/\d+/g)!.map(Number);
    const firstRow = rows[0]!.querySelector('text')!;
    const last = rows.at(-2)!.querySelector('text')!;
    return { firstRow: firstRow.textContent, last: last.textContent, blank: rows.at(-1)!.textContent,
      width: Number(root.getAttribute('width')), height: Number(root.getAttribute('height')),
      bottomY: y! + Number(last.getAttribute('y')), rightY: y! + Number(firstRow.getAttribute('y')),
      leftX: x! + Number(last.getAttribute('x')) };
  }, { source: svg.bytes.toString() });
  expect(samples).toMatchObject({ firstRow: first, last: 'LAST_LINE_MARKER', blank: '' });

  const raster = await page.evaluate(async ({ base64, bottomY, rightY, leftX, width }) => {
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
    return { width: canvas.width, height: canvas.height, bottom: hasText(leftX, bottomY, 125), right: hasText(width - 100, rightY, 75) };
  }, { base64: before.bytes.toString('base64'), ...samples });
  expect(raster).toEqual({ width: samples.width * 2, height: samples.height * 2, bottom: true, right: true });

  await settings.click();
  await format.selectOption('png');
  await settings.press('Escape');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await canvas.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect((await downloadImage(page)).bytes.equals(before.bytes)).toBe(true);
});

test('measures click-to-download for 200 JavaScript lines on the production build', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText(Array.from({ length: 200 }, (_, i) => `const item${i} = { value: ${i} };`).join('\n'));
  await page.getByRole('button', { name: 'Export settings' }).click();
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
