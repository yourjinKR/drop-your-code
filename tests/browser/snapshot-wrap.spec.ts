import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { downloadImage } from './helpers/download';

async function selectFormat(page: Page, format: string) {
  await page.getByRole('button', { name: 'Export settings' }).click();
  await page.getByRole('combobox', { name: 'Format' }).selectOption(format);
}

test('unwrapped Copy Image and Export keep a long source row and its right edge', async ({ browserName, context, page }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const first = `${'W'.repeat(180)} END`;
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText(`${first}\nnext\n`);
  await selectFormat(page, 'svg');
  const svg = (await downloadImage(page)).bytes.toString();
  const model = await page.evaluate((source) => {
    const root = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
    const rows = [...root.querySelectorAll('.code-row')];
    return { width: Number(root.getAttribute('width')), height: Number(root.getAttribute('height')),
      lines: rows.map((row) => row.textContent), baseline: Number(rows[0]?.querySelector('text')?.getAttribute('y')) };
  }, svg);
  expect(model.width).toBeGreaterThan(960);
  expect(model.lines).toEqual([first, 'next', '']);

  const supportsWebp = await page.evaluate(() => new Promise((resolve) => {
    document.createElement('canvas').toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp');
  }));
  const formats = ['png', 'jpg'];
  if (supportsWebp && browserName !== 'firefox') formats.push('webp');
  if (supportsWebp && browserName === 'firefox') {
    test.info().annotations.push({ type: 'limitation', description: 'Firefox does not emit a WebP download event in this harness.' });
  }
  const downloads: { format: string; base64: string }[] = [];
  for (const format of formats) {
    await selectFormat(page, format);
    await test.step(`Download ${format.toUpperCase()}`, async () => {
      downloads.push({ format, base64: (await downloadImage(page)).bytes.toString('base64') });
    });
  }
  const copy = browserName === 'chromium';
  if (copy) {
    await page.getByRole('button', { name: 'Copy Image' }).click();
    await expect(page.getByRole('status', { name: 'Image output status' })).toHaveText('Image copied.');
  }
  const decoded = await page.evaluate(async ({ downloads, copy, model }) => {
    async function inspect(blob: Blob, scale: number) {
      const image = await createImageBitmap(blob);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData((model.width - 70) * scale, Math.floor((model.baseline - 13) * scale),
          45 * scale, 14 * scale).data;
        return { width: image.width / scale, height: image.height / scale,
          rightEdge: pixels.some((red, index) => index % 4 === 0 && red > 150) };
      } finally {
        image.close();
      }
    }
    const results = [];
    for (const { format, base64 } of downloads) {
      const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      const blob = await (await fetch(`data:${mime};base64,${base64}`)).blob();
      results.push(await inspect(blob, 2));
    }
    if (copy) {
      const item = (await navigator.clipboard.read()).find(({ types }) => types.includes('image/png'))!;
      results.push(await inspect(await item.getType('image/png'), 4));
    }
    return results;
  }, { downloads, copy, model });
  expect(decoded).toHaveLength(formats.length + Number(copy));
  expect(decoded).toEqual(decoded.map(() => ({ width: model.width, height: model.height, rightEdge: true })));
});

test('wrapped SVG uses the editor’s visual rows with line numbers and syntax styling', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('checkbox', { name: 'Wrap lines' }).check();
  await page.getByRole('checkbox', { name: 'Line numbers' }).check();
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const code = `\t  const example = "${'한글 words  '.repeat(24)}";\n${'longToken'.repeat(26)}\n`;
  await editor.focus();
  await page.keyboard.insertText(code);
  await expect(page.locator('.code-window')).toHaveCSS('width', '960px');
  await expect(editor.locator('.cm-line').first().locator('span').first()).toBeAttached();
  const liveRows = await editor.locator('.cm-line').evaluateAll((lines) => lines.flatMap((line) => {
    const { top, height } = line.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(line).lineHeight);
    const rows = Array<string>(Math.round(height / lineHeight)).fill('');
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent ?? '';
      for (let i = 0; i < text.length; i++) {
        range.setStart(walker.currentNode, i);
        range.setEnd(walker.currentNode, i + 1);
        const rect = range.getBoundingClientRect();
        const row = Math.floor((rect.top + rect.height / 2 - top) / lineHeight);
        rows[row] = (rows[row] ?? '') + text.charAt(i);
      }
    }
    return rows;
  }));
  await selectFormat(page, 'svg');
  const svg = (await downloadImage(page)).bytes.toString();
  const outputRows = await page.evaluate((source) => {
    const root = new DOMParser().parseFromString(source, 'image/svg+xml');
    return [...root.querySelectorAll('.code-row')].map((row) =>
      [...row.querySelectorAll('text:not([text-anchor])')].map((text) => text.textContent).join(''));
  }, svg);
  expect(liveRows.join('')).toBe(code.replaceAll('\n', ''));
  expect(outputRows.length).toBeGreaterThan(3);
  expect(outputRows).toEqual(liveRows);
});

test('oversized unwrapped snapshots report the raster limit and still download SVG', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText('x'.repeat(2200));
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The snapshot is too large for raster export.');
  await selectFormat(page, 'svg');
  const svg = (await downloadImage(page)).bytes.toString();
  expect(svg).toContain('x'.repeat(2200));
});
