// @vitest-environment node
import { EditorState } from '@codemirror/state';
import { ensureSyntaxTree, indentUnit } from '@codemirror/language';
import { indentMore, insertNewlineAndIndent, toggleComment } from '@codemirror/commands';
import { describe, expect, it, vi } from 'vitest';
import { languageIds, languages, loadLanguage } from '../../src/editor/languages';
import { languageFixtures } from '../fixtures/code/languages';

describe('language registry', () => {
  it('covers the full initial language list and treats Plain Text as unparsed', async () => {
    const required = ['plaintext', 'java', 'kotlin', 'javascript', 'typescript', 'python', 'sql',
      'json', 'yaml', 'html', 'css', 'xml', 'shell', 'markdown'];
    expect(languageIds).toEqual(required);
    expect(languageFixtures.map(({ id }) => id)).toEqual(required);
    expect(new Set(Object.values(languages).map(({ label }) => label)).size).toBe(required.length);
    await expect(loadLanguage('plaintext')).resolves.toBeNull();
  });

  it('reuses the same pending and completed request', async () => {
    const request = loadLanguage('java');
    expect(loadLanguage('java')).toBe(request);
    expect(await request).not.toBeNull();
    expect(loadLanguage('java')).toBe(request);
  });

  it('evicts a rejected loader promise and permits a later successful call', async () => {
    const original = languages.markdown.load;
    const load = vi.spyOn(languages.markdown, 'load').mockRejectedValueOnce(new Error('offline'));
    try {
      const failed = loadLanguage('markdown');
      await expect(failed).rejects.toThrow('offline');
      load.mockImplementation(original);
      const retried = loadLanguage('markdown');
      expect(retried).not.toBe(failed);
      expect(await retried).not.toBeNull();
    } finally {
      load.mockRestore();
    }
  });

  it.each(languageFixtures)('$label highlights, indents and comments as supported', async (fixture) => {
    const { code, tokens, indent, comment } = fixture;
    const language = await loadLanguage(fixture.id);
    const extensions = [language?.support.extension ?? [], indentUnit.of('  ')];
    const parsed = EditorState.create({ doc: code, extensions });
    const spans = language?.highlight(code, 'dark') ?? [];
    for (const [token, color] of tokens) {
      expect(spans.some(({ from, to, style }) => code.slice(from, to).trim() === token && style.color === color), token)
        .toBe(true);
    }

    let state = EditorState.create({ doc: indent.before, selection: { anchor: indent.before.length }, extensions });
    if (language) expect(ensureSyntaxTree(state, state.doc.length, 1_000)).not.toBeNull();
    const commandTarget = () => ({ state, dispatch: (transaction: ReturnType<EditorState['update']>) => {
      state = transaction.state;
    } });
    expect(insertNewlineAndIndent(commandTarget())).toBe(true);
    expect(state.doc.toString()).toBe(`${indent.before}\n${' '.repeat(indent.spaces)}`);
    expect(indentMore(commandTarget())).toBe(true);
    expect(state.doc.toString()).toBe(`${indent.before}\n${' '.repeat(indent.spaces + 2)}`);

    state = parsed;
    const firstLine = state.doc.line(1);
    state = state.update({ selection: { anchor: firstLine.from, head: firstLine.to } }).state;
    expect(toggleComment(commandTarget())).toBe(comment !== undefined);
    if (typeof comment === 'string') expect(state.doc.line(1).text).toBe(`${comment} ${firstLine.text}`);
    else if (comment) expect(state.doc.line(1).text).toBe(`${comment[0]} ${firstLine.text} ${comment[1]}`);
    else expect(state.doc.toString()).toBe(code);
    if (comment) {
      expect(toggleComment(commandTarget())).toBe(true);
      expect(state.doc.toString()).toBe(code);
    }
  });
});
