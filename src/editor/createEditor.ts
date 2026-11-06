import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { history, historyKeymap, indentWithTab, standardKeymap } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import type { EditorSettings } from '../state/workspace';

export type EditorSurfaceProps = {
  code: string;
  settings: EditorSettings;
  onCodeChange: (code: string) => void;
};

export type EditorCompartments = {
  keymap: Compartment;
  language: Compartment;
  theme: Compartment;
  lineNumbers: Compartment;
  wrap: Compartment;
};

/** Marks synchronization from the common document, without echoing it back. */
export const externalCodeChange = Annotation.define<boolean>();

export function createEditor(
  parent: HTMLElement,
  props: EditorSurfaceProps,
  compartments: EditorCompartments,
): EditorView {
  return new EditorView({
    parent,
    state: EditorState.create({
      doc: props.code,
      extensions: [
        history(),
        indentUnit.of('  '),
        // Keep Escape unbound so CodeMirror's Escape-then-Tab exit always works.
        compartments.keymap.of(keymap.of([indentWithTab, ...historyKeymap, ...standardKeymap])),
        // Later tasks reconfigure these slots; no unsupported controls are exposed.
        compartments.language.of([]),
        compartments.theme.of([]),
        compartments.lineNumbers.of([]),
        compartments.wrap.of([]),
        EditorView.contentAttributes.of({
          'aria-label': 'Code editor',
          'aria-describedby': 'editor-help',
          autocapitalize: 'off',
          autocomplete: 'off',
          autocorrect: 'off',
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          const inputChanged = update.transactions.some(
            (transaction) => transaction.docChanged && !transaction.annotation(externalCodeChange),
          );
          if (inputChanged) props.onCodeChange(update.state.doc.toString());
        }),
      ],
    }),
  });
}
