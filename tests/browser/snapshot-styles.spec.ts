import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

async function svg(image: Locator) {
  return image.evaluate(async (element: HTMLImageElement) => (await fetch(element.src)).text());
}

async function setNumber(input: Locator, value: string) {
  await input.fill(value);
  await input.press('Enter');
}

test('applies window, background and type controls to the preview and editor', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Code editor' });
  await editor.focus();
  await page.keyboard.insertText('const value = "한글 👩‍💻";\nlast line');
  await page.getByRole('tab', { name: 'Preview' }).click();
  const image = page.getByRole('img', { name: 'Code snapshot' });
  await expect(image).toBeVisible();
  const original = await svg(image);
  expect(original).toContain('fill="#1d1f24"');
  expect(original).toContain('class="language-icon"');
  await page.getByText('Window', { exact: true }).click();
  const title = page.getByRole('textbox', { name: 'Title' });
  const longTitle = '<한글>&' + ' 긴 제목 👩‍💻'.repeat(30);
  await title.fill(longTitle);
  await expect.poll(() => svg(image)).toContain('&lt;한글&gt;&amp;');
  await expect.poll(() => svg(image)).toContain('…');
  await expect(title).toHaveValue(longTitle);
  await page.getByRole('checkbox', { name: 'Language icon' }).uncheck();
  await expect.poll(() => svg(image)).not.toContain('class="language-icon"');
  await setNumber(page.getByRole('textbox', { name: 'Radius' }), '20');
  await expect.poll(() => svg(image)).toContain('rx="20"');

  await page.getByText('Typography', { exact: true }).click();
  const font = page.getByRole('combobox', { name: 'Font', exact: true });
  await expect(font).toHaveAccessibleDescription(/Font stack: Consolas/);
  await expect(font.getByRole('option', { name: 'Courier New' })).toHaveCount(1);
  await font.selectOption('courier');
  await expect.poll(() => svg(image)).toContain('&quot;Courier New&quot;, monospace');
  const fontSize = page.getByRole('textbox', { name: 'Font size' });
  const previous = await image.getAttribute('src');
  await setNumber(fontSize, '99');
  await expect(fontSize).toHaveValue('99');
  await expect(fontSize).toHaveAttribute('aria-invalid', 'true');
  await expect(image).toHaveAttribute('src', previous!);
  await setNumber(fontSize, '22');
  await expect.poll(() => svg(image)).toContain('font-size="22"');
  await setNumber(page.getByRole('textbox', { name: 'Line height' }), '1.8');
  await setNumber(page.getByRole('textbox', { name: 'Code padding' }), '32');
  await expect.poll(async () => {
    const xml = await svg(image);
    const baselines = [...xml.matchAll(/<g class="code-row"><text x="33" y="([.\d]+)"/g)].map((match) => Number(match[1]));
    return baselines.length === 2 ? Number((baselines[1]! - baselines[0]!).toFixed(1)) : 0;
  }).toBe(39.6);
  await page.getByRole('combobox', { name: 'Syntax theme' }).selectOption('light');
  await expect.poll(() => svg(image)).toContain('fill="#ffffff"');
  const light = await image.getAttribute('src');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(image).toHaveAttribute('src', light!);
  await page.getByRole('button', { name: 'Collapse Properties' }).click();
  await page.getByRole('button', { name: 'Show Properties' }).click();
  await expect(title).toHaveValue(longTitle);
  await expect(fontSize).toHaveValue('22');
  await page.getByRole('tab', { name: 'Editor' }).click();
  await expect(page.locator('.cm-scroller')).toHaveCSS('font-size', '22px');
  await expect(page.locator('.cm-content')).toHaveCSS('padding-top', '32px');
  await editor.press('Control+z');
  await expect(editor.locator('.cm-line')).toHaveText('');
});

test('keeps a transparent edge, visible shadow and opaque code window at zero padding', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Preview' }).click();
  const image = page.getByRole('img', { name: 'Code snapshot' });
  await expect(image).toBeVisible();
  await page.getByText('Background', { exact: true }).click();
  await page.getByLabel('Color', { exact: true }).fill('#346789');
  await expect.poll(() => svg(image)).toContain('fill="#346789"');
  await setNumber(page.getByRole('textbox', { name: 'Background padding' }), '0');
  await page.getByRole('checkbox', { name: 'Transparent' }).check();
  await page.getByText('Window', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Shadow strength' }).selectOption('high');
  await expect.poll(() => svg(image)).toContain('stdDeviation="18"');
  expect(await svg(image)).not.toContain('fill="#346789"');
  const pixels = await image.evaluate(async (element: HTMLImageElement) => {
    const source = new DOMParser().parseFromString(await (await fetch(element.src)).text(), 'image/svg+xml');
    const frame = source.querySelector('svg > g[transform]')!.getAttribute('transform')!.match(/\d+/g)!.map(Number);
    const rect = source.querySelector('clipPath rect')!;
    const canvas = document.createElement('canvas');
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(element, 0, 0);
    const pixel = (x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data];
    const mid = frame[0]! + Number(rect.getAttribute('width')) / 2;
    const bottom = frame[1]! + Number(rect.getAttribute('height'));
    return { edge: pixel(0, 0), shadow: pixel(mid, bottom + 20), window: pixel(mid, bottom - 8) };
  });
  expect(pixels.edge[3]).toBe(0);
  expect(pixels.shadow[3]).toBeGreaterThan(0);
  expect(pixels.shadow[3]).toBeLessThan(255);
  expect(pixels.window).toEqual([29, 31, 36, 255]);
  await page.getByRole('checkbox', { name: 'Shadow', exact: true }).uncheck();
  await expect.poll(() => svg(image)).not.toContain('window-shadow');
  await page.getByRole('checkbox', { name: 'Transparent' }).uncheck();
  await expect.poll(() => svg(image)).toContain('fill="#346789"');
});

test('records 300-line style change to decoded preview latency', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('javascript');
  await expect(page.getByRole('status', { name: 'Editor status' })).toContainText('JavaScript');
  await page.getByRole('textbox', { name: 'Code editor' }).focus();
  await page.keyboard.insertText(Array.from({ length: 300 }, (_, index) => `const value${index} = "한글";`).join('\n'));
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.getByRole('img', { name: 'Code snapshot' })).toBeVisible();
  await page.getByText('Typography', { exact: true }).click();
  const fontSize = page.getByRole('textbox', { name: 'Font size' });
  const timings = [];
  for (const value of ['15', '16', '17', '18', '19', '20', '21']) {
    await fontSize.fill(value);
    const nextFrame = await page.evaluateHandle(() => ({
      next: new Promise<number>((resolve, reject) => {
        const image = document.querySelector<HTMLImageElement>('.preview-stage img')!;
        let started = 0;
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') started = performance.now();
        }, { capture: true, once: true });
        const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Preview did not update')); }, 3000);
        const observer = new MutationObserver(() => {
          observer.disconnect();
          clearTimeout(timeout);
          requestAnimationFrame(() => resolve(performance.now() - started));
        });
        observer.observe(image, { attributeFilter: ['src'] });
      }),
    }));
    await fontSize.press('Enter');
    timings.push(await nextFrame.evaluate((measurement) => measurement.next));
    await nextFrame.dispose();
  }
  await testInfo.attach('style timings', { body: JSON.stringify(timings), contentType: 'application/json' });
  console.log(`Style preview timings (ms) ${JSON.stringify(timings)}`);
});
