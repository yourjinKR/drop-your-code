import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { highlightTree, tagHighlighter } from '@lezer/highlight';
import { loadLanguage } from '../editor/languages';
import type { SnapshotInput } from '../state/workspace';
import { syntaxRules } from '../theme/syntaxHighlighting';
import type { SyntaxStyle } from '../theme/syntaxHighlighting';

export type HighlightSpan = Readonly<{ from: number; to: number; style: SyntaxStyle }>;

export async function highlightSnapshot(input: SnapshotInput, signal?: AbortSignal): Promise<HighlightSpan[]> {
  if (!input.code || input.languageId === 'plaintext') return [];
  const support = await loadLanguage(input.languageId);
  signal?.throwIfAborted();
  if (!support) return [];

  const state = EditorState.create({ doc: input.code.replace(/\r\n?/g, '\n'), extensions: support.extension });
  const deadline = performance.now() + 8000;
  let tree = ensureSyntaxTree(state, state.doc.length, 8);
  while (!tree) {
    if (performance.now() >= deadline) throw new Error('Snapshot syntax parsing timed out');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    signal?.throwIfAborted();
    tree = ensureSyntaxTree(state, state.doc.length, 8);
  }

  const rules = syntaxRules(input.themeId);
  const highlighter = tagHighlighter(rules.map(({ tag }, index) => ({ tag, class: String(index) })));
  const styles = rules.map(({ tag: _tag, ...style }) => style);
  const combined = new Map<string, SyntaxStyle>();
  const spans: HighlightSpan[] = [];
  highlightTree(tree, highlighter, (from, to, classes) => {
    let style = combined.get(classes);
    if (!style) {
      // CodeMirror applies later declarations last when tags overlap.
      const indexes = classes.split(' ').map(Number).sort((a, b) => a - b);
      style = indexes.reduce<SyntaxStyle>((result, index) => ({ ...result, ...styles[index] }), {});
      combined.set(classes, style);
    }
    spans.push({ from, to, style });
  });
  return spans;
}
