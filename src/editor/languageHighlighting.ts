import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';
import type { EditorThemeId } from '../state/workspace';
import { getBasicTheme } from '../theme/basicThemes';

export function createHighlightStyle(id: EditorThemeId) {
  const colors = getBasicTheme(id).syntax;
  return HighlightStyle.define([
    { tag: [tags.keyword, tags.modifier], color: colors.keyword },
    { tag: [tags.string, tags.special(tags.string)], color: colors.string },
    { tag: tags.comment, color: colors.comment },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: colors.literal },
    { tag: [tags.typeName, tags.className, tags.tagName, tags.heading], color: colors.type },
    { tag: [tags.propertyName, tags.attributeName, tags.function(tags.variableName), tags.link], color: colors.property },
    { tag: [tags.regexp, tags.escape], color: colors.escape },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
  ]);
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
