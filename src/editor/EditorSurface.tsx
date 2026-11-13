import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Compartment, EditorSelection } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { createEditor, externalCodeChange, lineNumberGutter, noExtension } from './createEditor';
import type { EditorCompartments, EditorSurfaceProps } from './createEditor';
import { buildKeymap, detectPlatform } from './keymaps';
import { editorThemes } from './languageHighlighting';
import type { KeymapPreset } from '../state/workspace';

export type { EditorSurfaceProps } from './createEditor';

export function EditorSurface(props: EditorSurfaceProps & { focusRef?: RefObject<(() => void) | null> }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const compartmentsRef = useRef<EditorCompartments | null>(null);
  const appliedKeymapRef = useRef<KeymapPreset | null>(null);
  const committedProps = useRef(props);
  const { focusRef } = props;

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
    compartmentsRef.current = compartments;
    appliedKeymapRef.current = committedProps.current.settings.keymap;
    viewRef.current = view;

    return () => {
      viewRef.current = null;
      compartmentsRef.current = null;
      appliedKeymapRef.current = null;
      view.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    if (!focusRef) return;
    focusRef.current = () => viewRef.current?.focus();
    return () => { focusRef.current = null; };
  }, [focusRef]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const compartments = compartmentsRef.current;
    if (!view || !compartments || appliedKeymapRef.current === props.settings.keymap) return;
    view.dispatch({
      effects: compartments.keymap.reconfigure(
        keymap.of(buildKeymap(props.settings.keymap, detectPlatform())),
      ),
    });
    appliedKeymapRef.current = props.settings.keymap;
  }, [props.settings.keymap]);

  const languageSupport = props.languageSupport ?? null;
  const { themeId, lineNumbers, wrap } = props.settings;
  useLayoutEffect(() => {
    const view = viewRef.current;
    const compartments = compartmentsRef.current;
    if (!view || !compartments) return;
    const extensions = [
      [compartments.language, languageSupport?.extension ?? noExtension],
      [compartments.theme, editorThemes[themeId]],
      [compartments.lineNumbers, lineNumbers ? lineNumberGutter : noExtension],
      [compartments.wrap, wrap ? EditorView.lineWrapping : noExtension],
    ] as const;
    const effects = extensions
      .filter(([compartment, extension]) => compartment.get(view.state) !== extension)
      .map(([compartment, extension]) => compartment.reconfigure(extension));
    if (effects.length) view.dispatch({ effects });
  }, [languageSupport, themeId, lineNumbers, wrap]);

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
