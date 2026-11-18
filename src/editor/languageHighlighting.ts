import { StateEffect } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import type { EditorThemeId } from '../state/workspace';
import { getBasicTheme } from '../theme/basicThemes';
import type { Highlighter } from '../theme/syntaxHighlighting';

const showHighlights = StateEffect.define<DecorationSet>();

export function textMateDecorations(highlight: Highlighter, theme: EditorThemeId) {
  return ViewPlugin.fromClass(class {
    decorations = Decoration.none;
    private timer?: ReturnType<typeof setTimeout>;

    constructor(view: EditorView) {
      this.schedule(view);
    }

    update(update: ViewUpdate) {
      for (const transaction of update.transactions) {
        this.decorations = this.decorations.map(transaction.changes);
        for (const effect of transaction.effects) {
          if (effect.is(showHighlights)) this.decorations = effect.value;
        }
      }
      if (update.docChanged) this.schedule(update.view);
    }

    schedule(view: EditorView) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (view.composing) return;
        let decorations = Decoration.none;
        try {
          decorations = Decoration.set(highlight(view.state.doc.toString(), theme).map(({ from, to, style }) => {
            const css = [style.color && `color:${style.color}`, style.fontStyle && `font-style:${style.fontStyle}`,
              style.fontWeight && `font-weight:${style.fontWeight}`,
              style.textDecoration && `text-decoration:${style.textDecoration}`].filter(Boolean).join(';');
            return Decoration.mark({ attributes: { style: css } }).range(from, to);
          }));
        } catch {
          // A highlighting failure must leave the document editable.
        }
        view.dispatch({ effects: showHighlights.of(decorations) });
      }, 36);
    }

    destroy() {
      clearTimeout(this.timer);
    }
  }, {
    decorations: (plugin) => plugin.decorations,
    eventHandlers: { compositionend(_event, view) { this.schedule(view); } },
  });
}

function createEditorTheme(id: EditorThemeId) {
  const colors = getBasicTheme(id);
  return EditorView.theme({
    '&': { backgroundColor: colors.background, color: colors.foreground, colorScheme: id },
    '&.cm-focused': { outline: `2px solid ${colors.focus}`, outlineOffset: '-2px' },
    '.cm-content': { caretColor: colors.foreground },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: colors.foreground },
    '.cm-content ::selection, .cm-line::selection, .cm-selectionBackground': { backgroundColor: colors.selection },
    '.cm-gutters': { backgroundColor: colors.background, color: colors.muted, borderRightColor: colors.border },
  }, { dark: id === 'dark' });
}

export const editorThemes = { dark: createEditorTheme('dark'), light: createEditorTheme('light') };
