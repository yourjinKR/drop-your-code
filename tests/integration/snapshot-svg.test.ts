import { describe, expect, it } from 'vitest';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { renderSnapshotSvg } from '../../src/snapshot/renderSvg';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';

describe('snapshot SVG', () => {
  it('serializes all rows, styling and literal code as standalone vectors', () => {
    const code = `const  한글\t👩‍💻 <script>&"'\u0000\n${'x'.repeat(120)}last\n`;
    const input = selectSnapshotInput(createInitialWorkspace());
    const model = layoutSnapshot({ ...input, code, lineNumbers: true, wrap: true,
      presentation: { ...input.presentation, shadowEnabled: true },
    },
      [{ from: 0, to: 5, style: { color: '#d7a9f0', fontWeight: 'bold' } }], (text) => text.length * 10,
      { measureWrap: () => [[87]] });
    const svg = new DOMParser().parseFromString(renderSnapshotSvg(model), 'image/svg+xml');
    expect(svg.querySelector('parsererror, script, foreignObject, image, [href]')).toBeNull();
    expect(svg.documentElement.getAttribute('viewBox')).toBe(`0 0 ${model.width} ${model.height}`);
    expect([...svg.querySelectorAll('circle')].map((circle) => circle.getAttribute('fill')))
      .toEqual(['#ff5f57', '#febc2e', '#28c840']);
    expect(svg.querySelector('rect[fill="#252525"]')?.getAttribute('height')).toBe('46');
    expect(svg.querySelectorAll('[stroke]')).toHaveLength(1);
    expect(svg.querySelector('[stroke]')?.getAttribute('d')).toBe(`M${model.gutter - 0.5} 46V${model.window.height}`);
    expect(svg.querySelector('.language-icon, .window-title')).toBeNull();
    expect(svg.querySelector('feGaussianBlur')).not.toBeNull();
    const rows = [...svg.querySelectorAll('.code-row')];
    expect(rows[0]?.textContent).toBe('1const  한글\t👩‍💻 <script>&"\'�');
    expect(rows[0]?.querySelector('[font-weight="bold"]')?.getAttribute('fill')).toBe('#d7a9f0');
    expect(rows[1]?.textContent?.startsWith('2')).toBe(true);
    expect(rows[2]?.textContent?.endsWith('last')).toBe(true);
    expect(rows[2]?.querySelector('[text-anchor="end"]')).toBeNull();
    expect(rows[3]?.textContent).toBe('3');
  });

  it('serializes the visible title with its language extension as literal text', () => {
    const input = selectSnapshotInput(createInitialWorkspace());
    const model = layoutSnapshot({ ...input, languageId: 'java',
      presentation: { ...input.presentation, title: '<예제>&', showTitle: true },
    }, [], (text) => text.length * 10);
    const svg = new DOMParser().parseFromString(renderSnapshotSvg(model), 'image/svg+xml');
    expect(svg.querySelector('.window-title')?.textContent).toBe('<예제>&.java');
    expect(svg.querySelector('parsererror, .language-icon')).toBeNull();
    expect(svg.querySelectorAll('[stroke]')).toHaveLength(0);
  });
});
