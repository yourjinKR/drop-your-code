import { useLayoutEffect, useRef } from 'react';
import { Compartment, EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { createEditor, externalCodeChange } from './createEditor';
import type { EditorCompartments, EditorSurfaceProps } from './createEditor';

export type { EditorSurfaceProps } from './createEditor';

export function EditorSurface(props: EditorSurfaceProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const committedProps = useRef(props);

  useLayoutEffect(() => {
    committedProps.current = props;
  });

  useLayoutEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const compartments: EditorCompartments = {
      keymap: new Compartment(),
      language: new Compartment(),
      theme: new Compartment(),
      lineNumbers: new Compartment(),
      wrap: new Compartment(),
    };
    const view = createEditor(parent, {
      ...committedProps.current,
      onCodeChange: (code) => committedProps.current.onCodeChange(code),
    }, compartments);
    viewRef.current = view;

    return () => {
      viewRef.current = null;
      view.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const document = view.state.toText(props.code);
    if (view.state.doc.eq(document)) return;

    const selection = EditorSelection.create(
      view.state.selection.ranges.map((range) => EditorSelection.range(
        Math.min(range.anchor, document.length),
        Math.min(range.head, document.length),
      )),
      view.state.selection.mainIndex,
    );
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: document },
      selection,
      annotations: externalCodeChange.of(true),
    });
  }, [props.code]);

  return <div className="editor-surface" ref={parentRef} />;
}
