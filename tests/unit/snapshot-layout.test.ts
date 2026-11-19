import { describe, expect, it } from 'vitest';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';

const input = selectSnapshotInput(createInitialWorkspace());
const measure = (text: string) => [...text].length * 10;

describe('snapshot layout', () => {
  it('limits width only with wrapping and includes the measured line number gutter', () => {
    expect(layoutSnapshot(input, [], measure).window.width).toBe(320);
    const code = 'x'.repeat(120);
    expect(layoutSnapshot({ ...input, code, wrap: true }, [], measure, { measureWrap: () => [[91]] }).window.width).toBe(960);
    const unwrapped = layoutSnapshot({ ...input, code }, [], measure);
    expect(unwrapped.window.width).toBe(1250);
    expect(unwrapped.rows).toHaveLength(1);
    expect(unwrapped.rows[0]?.runs[0]?.text).toBe(code);
    const widths = [9, 10, 99, 100].map((lines) => layoutSnapshot({
      ...input, code: Array(lines).fill('x'.repeat(40)).join('\n'), lineNumbers: true,
    }, [], measure).window.width);
    expect(widths).toEqual([485, 495, 495, 505]);
  });

  it('counts continuation and empty rows, including mixed line endings', () => {
    const code = `${'x'.repeat(100)}\r\n\r`;
    const model = layoutSnapshot({ ...input, code, lineNumbers: true, wrap: true }, [], measure, {
      measureWrap: () => [[87]],
    });
    expect(model.rows.map(({ lineNumber, continuation }) => [lineNumber, continuation])).toEqual([
      [1, false], [1, true], [2, false], [3, false],
    ]);
    expect(model.window.height).toBe(178);
    expect(model.editorContentHeight).toBe(132);
    const unwrapped = layoutSnapshot({ ...input, code, lineNumbers: true }, [], measure);
    expect(unwrapped.rows.map(({ lineNumber }) => lineNumber)).toEqual([1, 2, 3]);
    expect(unwrapped.editorContentHeight).toBe(111);
  });

  it('preserves every grapheme and advances tabs to two-column stops', () => {
    const code = `A\tB\t${'👩‍💻'.repeat(80)}한`;
    const model = layoutSnapshot({ ...input, code, wrap: true }, [], measure, {
      measureWrap: () => [[4 + 29 * '👩‍💻'.length, 4 + 59 * '👩‍💻'.length]],
    });
    const runs = model.rows.flatMap(({ runs }) => runs);
    expect(runs.map(({ text }) => text).join('')).toBe(code);
    expect(runs[1]).toMatchObject({ text: '\t', width: 10 });
    expect(runs[3]).toMatchObject({ text: '\t', width: 10 });
    expect(model.rows.every(({ runs }) => !runs.at(0)?.text.startsWith('\u200d'))).toBe(true);
  });
});
