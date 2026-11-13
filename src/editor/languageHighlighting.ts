import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import type { EditorThemeId } from '../state/workspace';
import { getBasicTheme } from '../theme/basicThemes';
import { syntaxRules } from '../theme/syntaxHighlighting';

export function createHighlightStyle(id: EditorThemeId) {
  return HighlightStyle.define(syntaxRules(id));
}

function createEditorTheme(id: EditorThemeId) {
  const colors = getBasicTheme(id);
  return [
    EditorView.theme({
      '&': { backgroundColor: colors.background, color: colors.foreground, colorScheme: id },
      '&.cm-focused': { outline: `2px solid ${colors.focus}`, outlineOffset: '-2px' },
      '.cm-content': { caretColor: colors.foreground },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: colors.foreground },
      '.cm-content ::selection, .cm-line::selection, .cm-selectionBackground': { backgroundColor: colors.selection },
      '.cm-gutters': { backgroundColor: colors.background, color: colors.muted, borderRightColor: colors.border },
    }, { dark: id === 'dark' }),
    syntaxHighlighting(createHighlightStyle(id)),
  ];
}

export const editorThemes = { dark: createEditorTheme('dark'), light: createEditorTheme('light') };
