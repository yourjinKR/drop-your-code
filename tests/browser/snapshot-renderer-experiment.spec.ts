import { expect, test } from '@playwright/test';

test('compares native SVG with a full-document foreignObject capture', async ({ page, context }) => {
  await page.goto('/');
  await context.setOffline(true);
  const result = await page.evaluate(async () => {
    const ns = 'http://www.w3.org/2000/svg';
    const html = 'http://www.w3.org/1999/xhtml';
    const width = 1056;
    const family = 'Consolas, "SFMono-Regular", Menlo, monospace';
    const serialize = new XMLSerializer();
    const results = [];

    for (const lines of [200, 300]) {
      const dark = lines === 200;
      const height = 134 + 21 * lines;
      const fixture = Array.from({ length: lines }, (_, index) =>
        index === 0 ? 'first\t  한글 👩‍💻 => != ffi ' + 'long '.repeat(40)
          : index === lines - 2 ? 'last line' : index === lines - 1 ? '' : `const value${index} = ${index};`);
      const theme = dark ? ['#1d1f24', '#d7a9f0'] : ['#ffffff', '#742894'];
      for (const renderer of ['svg', 'dom'] as const) {
        const start = performance.now();
        const root = document.createElementNS(ns, 'svg');
        root.setAttribute('width', String(width));
        root.setAttribute('height', String(height));
        root.innerHTML = `<defs><filter id="shadow"><feDropShadow dy="16" stdDeviation="12" flood-opacity=".2"/></filter></defs>
          <rect x="48" y="16" width="960" height="${height - 80}" rx="12" fill="#000" filter="url(#shadow)"/>
          <rect x="48" y="16" width="960" height="${height - 80}" rx="12" fill="${theme[0]}"/>`;
        const foreign = document.createElementNS(ns, 'foreignObject');
        foreign.setAttribute('x', '72');
        foreign.setAttribute('y', '57');
        foreign.setAttribute('width', '912');
        foreign.setAttribute('height', String(21 * (lines + 1)));
        const block = document.createElementNS(html, 'div');
        block.setAttribute('style', `font:14px/21px ${family};white-space:pre;tab-size:2;color:${theme[1]};font-variant-ligatures:none`);
        foreign.append(block);
        if (renderer === 'dom') root.append(foreign);
        const sample = fixture.flatMap((line) => line.length > 100 ? [line.slice(0, 100), line.slice(100)] : [line]);
        for (const [index, line] of sample.entries()) {
          const expanded = line.replace('\t', ' ');
          if (renderer === 'dom') {
            const row = document.createElementNS(html, 'div');
            row.textContent = expanded || '\u00a0';
            block.append(row);
          } else {
            const row = document.createElementNS(ns, 'text');
            row.setAttribute('x', '72');
            row.setAttribute('y', String(73 + index * 21));
            row.setAttribute('fill', theme[1]!);
            row.setAttribute('style', `font:14px ${family};white-space:pre;font-variant-ligatures:none`);
            row.textContent = expanded;
            root.append(row);
          }
        }
        const source = serialize.serializeToString(root);
        const generationMs = performance.now() - start;
        const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const pixels = canvas.getContext('2d')!;
          pixels.drawImage(image, 0, 0);
          const pixel = (x: number, y: number) => Array.from(pixels.getImageData(x, y, 1, 1).data);
          let alpha: (number | undefined)[] | null = null;
          let windowColor: number[] | null = null;
          let pixelError: string | null = null;
          try {
            alpha = [pixel(0, 0)[3], pixel(500, height - 55)[3], pixel(1000, 120)[3]];
            windowColor = pixel(1000, 120).slice(0, 3);
          } catch (error) {
            if (!(error instanceof DOMException) || error.name !== 'SecurityError') throw error;
            pixelError = error.name;
          }
          const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
          const fallbackSource = source.replaceAll('Consolas', 'Unavailable_Test_Font');
          const fallback = new Image();
          const fallbackUrl = URL.createObjectURL(new Blob([fallbackSource], { type: 'image/svg+xml' }));
          try {
            fallback.src = fallbackUrl;
            await fallback.decode();
          } finally {
            URL.revokeObjectURL(fallbackUrl);
          }
          results.push({
            lines, renderer, generationMs, bytes: new TextEncoder().encode(source).length,
            width: image.naturalWidth, height: image.naturalHeight,
            vectorRows: parsed.querySelectorAll('text').length,
            domRows: parsed.getElementsByTagNameNS(html, 'div').length - Number(renderer === 'dom'),
            first: parsed.documentElement.textContent?.includes('한글 👩‍💻'),
            last: parsed.documentElement.textContent?.includes('last line'),
            alpha, windowColor, pixelError, fallbackWidth: fallback.naturalWidth,
          });
        } finally {
          URL.revokeObjectURL(url);
        }
      }
    }
    return { browser: navigator.userAgent, results };
  });
  for (const run of result.results) {
    expect(run.first && run.last).toBe(true);
    expect(run.width).toBe(1056);
    expect(run.fallbackWidth).toBe(run.width);
    if (run.renderer === 'svg') {
      expect(run.pixelError).toBeNull();
      expect(run.alpha?.[0]).toBe(0);
      expect(run.alpha?.[1]).toBeGreaterThan(0);
      expect(run.alpha?.[1]).toBeLessThan(255);
      expect(run.alpha?.[2]).toBe(255);
      expect(run.windowColor).toEqual(run.lines === 200 ? [29, 31, 36] : [255, 255, 255]);
    }
    expect(run.vectorRows).toBe(run.renderer === 'svg' ? run.lines + 1 : 0);
    expect(run.domRows).toBe(run.renderer === 'dom' ? run.lines + 1 : 0);
  }
  console.log(JSON.stringify(result));
});
