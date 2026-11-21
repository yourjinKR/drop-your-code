import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { downloadImage } from './helpers/download';

async function selectSvg(page: Page) {
  await page.getByRole('button', { name: 'Export settings' }).click();
  await page.getByRole('combobox', { name: 'Format' }).selectOption('svg');
}

async function setNumber(input: Locator, value: string) {
  await input.fill(value);
  await input.press('Enter');
}

test('applies window and typography controls to the live canvas and exported SVG', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  const frame = page.locator('.code-window');
  await editor.focus();
  await page.keyboard.insertText('const value = "한글 👩‍💻";\nlast line');
  await expect(frame).toHaveCSS('background-color', 'rgb(30, 30, 30)');
  await expect(frame.locator('.code-window-title')).toHaveCount(0);
  await page.getByText('Window', { exact: true }).click();
  const title = page.getByRole('textbox', { name: 'Title' });
  const longTitle = '<한글>&' + ' 긴 제목 👩‍💻'.repeat(30);
  await title.fill(longTitle);
  const showTitle = page.getByRole('checkbox', { name: 'Show title' });
  await showTitle.check();
  await expect(frame.locator('.code-window-title')).toContainText('<한글>&');
  await setNumber(page.getByRole('textbox', { name: 'Radius' }), '20');
  await expect(frame).toHaveCSS('border-top-left-radius', '20px');

  await page.getByText('Typography', { exact: true }).click();
  const font = page.getByRole('combobox', { name: 'Font', exact: true });
  await expect(font).toHaveAccessibleDescription(/^Font stack: "Cascadia Mono", "Cascadia Code", Consolas/);
  await font.selectOption('courier');
  const fontSize = page.getByRole('textbox', { name: 'Font size' });
  const scroller = page.locator('.cm-scroller');
  await setNumber(fontSize, '99');
  await expect(fontSize).toHaveValue('99');
  await expect(fontSize).toHaveAttribute('aria-invalid', 'true');
  await expect(scroller).toHaveCSS('font-size', '14px');
  await setNumber(fontSize, '22');
  await setNumber(page.getByRole('textbox', { name: 'Line height' }), '1.8');
  await setNumber(page.getByRole('textbox', { name: 'Code padding' }), '32');
  await expect(scroller).toHaveCSS('font-size', '22px');
  await expect(page.locator('.cm-content')).toHaveCSS('padding-top', '32px');
  await page.getByRole('combobox', { name: 'Syntax theme' }).selectOption('light');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(frame).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(frame.locator('.code-window-header')).toHaveCSS('background-color', 'rgb(241, 241, 241)');
  await page.getByRole('button', { name: 'Collapse Properties' }).click();
  await page.getByRole('button', { name: 'Show Properties' }).click();
  await expect(title).toHaveValue(longTitle);
  await expect(fontSize).toHaveValue('22');

  await selectSvg(page);
  const source = (await downloadImage(page)).bytes.toString();
  expect(source).toContain('fill="#ffffff"');
  expect(source).toContain('fill="#f1f1f1"');
  expect(source).toContain('rx="20"');
  expect(source).toContain('&lt;한글&gt;&amp;');
  expect(source).toContain('…');
  expect(source).toContain('&quot;Courier New&quot;, monospace');
  expect(source).toContain('font-size="22"');
  const baselines = [...source.matchAll(/<g class="code-row"><text x="32" y="([.\d]+)"/g)].map((match) => Number(match[1]));
  expect(baselines).toHaveLength(2);
  expect(baselines[1]! - baselines[0]!).toBeCloseTo(39.6);
  await showTitle.uncheck();
  await expect(frame.locator('.code-window-title')).toHaveCount(0);
  expect((await downloadImage(page)).bytes.toString()).not.toContain('class="window-title"');
  await editor.press('Control+z');
  await expect(editor.locator('.cm-line')).toHaveText('');
});

test('keeps a transparent edge, visible shadow and opaque code window at zero padding', async ({ page }) => {
  await page.goto('/');
  const composition = page.locator('.canvas-composition');
  await page.getByText('Background', { exact: true }).click();
  const transparent = page.getByRole('checkbox', { name: 'Transparent' });
  const padding = page.getByRole('textbox', { name: 'Background padding' });
  await expect(transparent).toBeChecked();
  await expect(padding).toHaveValue('0');
  await expect(composition).toHaveAttribute('data-transparent', 'true');
  await expect(composition).toHaveCSS('padding', '0px');
  await transparent.uncheck();
  await page.getByLabel('Color', { exact: true }).fill('#346789');
  await setNumber(padding, '24');
  await expect(composition).toHaveCSS('padding', '24px');
  await expect(composition).toHaveCSS('background-color', 'rgb(52, 103, 137)');
  await setNumber(padding, '0');
  await transparent.check();
  await expect(composition).toHaveAttribute('data-transparent', 'true');
  await page.getByText('Window', { exact: true }).click();
  const shadow = page.getByRole('checkbox', { name: 'Shadow', exact: true });
  await expect(shadow).not.toBeChecked();
  await expect(page.locator('.code-window')).toHaveCSS('box-shadow', 'none');
  await shadow.check();
  await page.getByRole('combobox', { name: 'Shadow strength' }).selectOption('high');
  await selectSvg(page);
  const source = (await downloadImage(page)).bytes.toString();
  expect(source).toContain('stdDeviation="18"');
  expect(source).not.toContain('fill="#346789"');
  const pixels = await page.evaluate(async (svg) => {
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const frame = parsed.querySelector('svg > g[transform]')!.getAttribute('transform')!.match(/\d+/g)!.map(Number);
    const rect = parsed.querySelector('clipPath rect')!;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      const pixel = (x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data];
      const mid = frame[0]! + Number(rect.getAttribute('width')) / 2;
      const bottom = frame[1]! + Number(rect.getAttribute('height'));
      return { edge: pixel(0, 0), shadow: pixel(mid, bottom + 20), window: pixel(mid, bottom - 8) };
    } finally {
      URL.revokeObjectURL(url);
    }
  }, source);
  expect(pixels.edge[3]).toBe(0);
  expect(pixels.shadow[3]).toBeGreaterThan(0);
  expect(pixels.shadow[3]).toBeLessThan(255);
  expect(pixels.window).toEqual([30, 30, 30, 255]);
  await shadow.uncheck();
  await transparent.uncheck();
  const opaque = (await downloadImage(page)).bytes.toString();
  expect(opaque).not.toContain('window-shadow');
  expect(opaque).toContain('fill="#346789"');
});

test('records 300-line typography change to the live canvas', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText(Array.from({ length: 300 }, (_, index) => `const value${index} = "한글";`).join('\n'));
  await page.getByText('Typography', { exact: true }).click();
  const fontSize = page.getByRole('textbox', { name: 'Font size' });
  const timings = [];
  for (const value of ['15', '16', '17', '18', '19', '20', '21']) {
    await fontSize.fill(value);
    const nextFrame = await page.evaluateHandle(() => ({
      next: new Promise<number>((resolve, reject) => {
        const frame = document.querySelector('.code-window')!;
        let started = 0;
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') started = performance.now();
        }, { capture: true, once: true });
        const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Canvas did not update')); }, 3000);
        const observer = new MutationObserver(() => {
          observer.disconnect();
          clearTimeout(timeout);
          requestAnimationFrame(() => resolve(performance.now() - started));
        });
        observer.observe(frame, { attributeFilter: ['style'] });
      }),
    }));
    await fontSize.press('Enter');
    timings.push(await nextFrame.evaluate((measurement) => measurement.next));
    await nextFrame.dispose();
  }
  await testInfo.attach('style timings', { body: JSON.stringify(timings), contentType: 'application/json' });
  console.log(`Live typography timings (ms) ${JSON.stringify(timings)}`);
});
