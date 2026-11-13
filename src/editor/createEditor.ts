import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { history, isolateHistory } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import type { LanguageSupport } from '@codemirror/language';
import type { EditorSettings } from '../state/workspace';
import { buildKeymap, detectPlatform } from './keymaps';
import { editorThemes } from './languageHighlighting';

const lineEditEvents = [
  'delete.line', 'delete.cut', 'move.line', 'input.copyline', 'indent', 'input.indent', 'delete.dedent',
];

export type EditorSurfaceProps = {
  code: string;
  settings: EditorSettings;
  languageSupport?: LanguageSupport | null;
  onCodeChange: (code: string) => void;
};

export type EditorCompartments = {
  keymap: Compartment;
  language: Compartment;
  theme: Compartment;
  lineNumbers: Compartment;
  wrap: Compartment;
};

export const noExtension = [] as const;
export const lineNumberGutter = lineNumbers();

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
        compartments.language.of(props.languageSupport?.extension ?? noExtension),
        compartments.theme.of(editorThemes[props.settings.themeId]),
        compartments.lineNumbers.of(props.settings.lineNumbers ? lineNumberGutter : noExtension),
        compartments.wrap.of(props.settings.wrap ? EditorView.lineWrapping : noExtension),
        EditorView.contentAttributes.of({
          'aria-label': 'Code editor',
          'aria-describedby': 'editor-help',
          translate: 'no',
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
