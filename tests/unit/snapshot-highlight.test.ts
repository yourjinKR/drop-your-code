// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { highlightSnapshot } from '../../src/snapshot/highlight';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';
import { getBasicTheme } from '../../src/theme/basicThemes';

const input = selectSnapshotInput(createInitialWorkspace());

describe('whole-document syntax highlighting', () => {
  it('uses the syntax theme and highlights the last of 300 lines', async () => {
    const code = Array.from({ length: 300 }, (_, index) => `const item${index} = "value";`).join('\n');
    const palettes = [
      ['dark', '#cf8e6d'], ['light', '#0033b3'], ['vscode-dark', '#569cd6'], ['vscode-light', '#0000ff'],
    ] as const;
    for (const [themeId, color] of palettes) {
      const tokens = await highlightSnapshot({ ...input, code, languageId: 'javascript', themeId });
      expect(tokens.find(({ from }) => from === code.lastIndexOf('const'))?.style.color).toBe(color);
    }
  });

  it.each([
    ['markdown', '**bold**', 'bold', 'fontWeight', 'bold'],
    ['kotlin', 'val message = "hello"', 'val', 'color', '#cf8e6d'],
    ['shell', 'echo "hello"', '"hello"', 'color', '#6aab73'],
    ['html', '<script>const value = 1;</script>', 'const', 'color', '#cf8e6d'],
  ] as const)('preserves %s token styles', async (languageId, code, text, property, value) => {
    const tokens = await highlightSnapshot({ ...input, code, languageId });
    expect(tokens.some(({ from, to, style }) => code.slice(from, to).includes(text) && style[property] === value)).toBe(true);
  });

  it('leaves plain text unstyled', async () => {
    expect(await highlightSnapshot({ ...input, code: '<&\t한글\n' })).toEqual([]);
  });

  it.each(['dark', 'light'] as const)('styles Java annotations and their arguments in the %s snapshot theme', async (themeId) => {
    const lines = [
      'package example.demo;',
      'import example.annotations.Profile;',
      '@Service',
      '@Profile("!prod")',
      'class Example {',
      '\t@Override',
      '\tpublic String label() { return "예시"; }',
      '}',
    ];
    const { className, type, function: callable, string, annotation, keyword } = getBasicTheme(themeId).syntax;
    expect(new Set([className, type, callable, string, annotation]).size).toBe(5);
    const tokens = await highlightSnapshot({ ...input, code: lines.join('\r\n'), languageId: 'java', themeId });
    const code = lines.join('\n');
    const styled = tokens.map(({ from, to, style }) => [code.slice(from, to).trim(), style.color]);
    expect(styled).toEqual(expect.arrayContaining([
      ['package', keyword], ['import', keyword],
      ['@Service', annotation], ['@Profile', annotation], ['@Override', annotation], ['"!prod"', string],
      ['Example', className], ['String', type], ['label', callable], ['"예시"', string],
    ]));
    expect(tokens.some(({ from }) => from === code.indexOf('example'))).toBe(false);
    expect(tokens.some(({ from }) => from === code.indexOf('example', code.indexOf('import')))).toBe(false);
  });
});
