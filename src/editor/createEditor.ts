import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { history, isolateHistory } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import type { EditorSettings } from '../state/workspace';
import { buildKeymap, detectPlatform } from './keymaps';

const lineEditEvents = [
  'delete.line', 'delete.cut', 'move.line', 'input.copyline', 'indent', 'input.indent', 'delete.dedent',
];

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
        EditorState.transactionExtender.of((transaction) => (
          transaction.docChanged && lineEditEvents.some((event) => transaction.isUserEvent(event))
            ? { annotations: isolateHistory.of('full') }
            : null
        )),
        indentUnit.of('  '),
        compartments.keymap.of(keymap.of(buildKeymap(props.settings.keymap, detectPlatform()))),
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
