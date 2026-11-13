import { describe, expect, it } from 'vitest';
import { highlightSnapshot } from '../../src/snapshot/highlight';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';

const input = selectSnapshotInput(createInitialWorkspace());

describe('whole-document syntax highlighting', () => {
  it('uses the syntax theme and highlights the last of 300 lines', async () => {
    const code = Array.from({ length: 300 }, (_, index) => `const item${index} = "value";`).join('\n');
    for (const [themeId, color] of [['dark', '#d7a9f0'], ['light', '#742894']] as const) {
      const tokens = await highlightSnapshot({ ...input, code, languageId: 'javascript', themeId });
      expect(tokens.find(({ from }) => from === code.lastIndexOf('const'))?.style.color).toBe(color);
    }
  });

  it.each([
    ['markdown', '**bold**', 'bold', 'fontWeight', 'bold'],
    ['kotlin', 'val message = "hello"', 'val', 'color', '#d7a9f0'],
    ['shell', 'echo "hello"', '"hello"', 'color', '#acd69e'],
    ['html', '<script>const value = 1;</script>', 'const', 'color', '#d7a9f0'],
  ] as const)('preserves %s token styles', async (languageId, code, text, property, value) => {
    const tokens = await highlightSnapshot({ ...input, code, languageId });
    expect(tokens.some(({ from, to, style }) => code.slice(from, to).includes(text) && style[property] === value)).toBe(true);
  });

  it('leaves plain text unstyled', async () => {
    expect(await highlightSnapshot({ ...input, code: '<&\t한글\n' })).toEqual([]);
  });
});
