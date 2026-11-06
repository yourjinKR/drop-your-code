import { act, render } from '@testing-library/react';
import { EditorSelection, EditorState } from '@codemirror/state';
import { EditorView, keymap, runScopeHandlers } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { EditorSurface } from '../../src/editor/EditorSurface';
import { buildKeymap } from '../../src/editor/keymaps';
import { createInitialWorkspace } from '../../src/state/workspace';
import type { KeymapPreset } from '../../src/state/workspace';

const mounted: { host: HTMLElement; view: EditorView }[] = [];
const originalRects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects');
const originalBoundingRect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect');

beforeAll(() => {
  // jsdom has no text layout; keep only its missing geometry APIs neutral for commands.
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true, value: () => new DOMRect(),
  });
});

afterAll(() => {
  if (originalRects) Object.defineProperty(Range.prototype, 'getClientRects', originalRects);
  else Reflect.deleteProperty(Range.prototype, 'getClientRects');
  if (originalBoundingRect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', originalBoundingRect);
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
});

afterEach(() => {
  for (const { host, view } of mounted) {
    view.destroy();
    host.remove();
  }
  mounted.length = 0;
});

function createView(
  code: string,
  preset: KeymapPreset,
  comments = true,
  platform: 'windows' | 'macos' | 'other' = 'windows',
): EditorView {
  const host = document.createElement('div');
  document.body.append(host);
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: code,
      extensions: [
        history(),
        keymap.of(buildKeymap(preset, platform)),
        ...(comments ? [EditorState.languageData.of(() => [{ commentTokens: { line: '//' } }])] : []),
      ],
    }),
  });
  mounted.push({ host, view });
  view.focus();
  return view;
}

function press(view: EditorView, key: string, modifiers: KeyboardEventInit = {}): boolean {
  let handled = false;
  const specialCodes: Record<string, number> = { Tab: 9, Backspace: 8, ArrowUp: 38, ArrowDown: 40, '/': 191 };
  const keyCode = specialCodes[key] ?? (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
  act(() => {
    handled = runScopeHandlers(view, new KeyboardEvent('keydown', {
      key: modifiers.shiftKey && key.length === 1 ? key.toUpperCase() : key,
      keyCode,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    }), 'editor');
  });
  return handled;
}

const windowsCases: {
  preset: KeymapPreset;
  name: string;
  key: string;
  modifiers: KeyboardEventInit;
  code: string;
  anchor: number;
  expected: string;
}[] = [
  { preset: 'intellij', name: 'duplicate line', key: 'd', modifiers: { ctrlKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'alpha\nalpha\nbeta' },
  { preset: 'vscode', name: 'duplicate line', key: 'ArrowDown', modifiers: { shiftKey: true, altKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'alpha\nalpha\nbeta' },
  { preset: 'intellij', name: 'delete last line', key: 'y', modifiers: { ctrlKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'alpha' },
  { preset: 'vscode', name: 'delete last line', key: 'k', modifiers: { ctrlKey: true, shiftKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'alpha' },
  { preset: 'intellij', name: 'move line down', key: 'ArrowDown', modifiers: { shiftKey: true, altKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'beta\nalpha' },
  { preset: 'vscode', name: 'move line down', key: 'ArrowDown', modifiers: { altKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'beta\nalpha' },
  { preset: 'intellij', name: 'move line up', key: 'ArrowUp', modifiers: { shiftKey: true, altKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'beta\nalpha' },
  { preset: 'vscode', name: 'move line up', key: 'ArrowUp', modifiers: { altKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'beta\nalpha' },
];

// Official macOS mappings are separate input data, rather than a Ctrl→Meta conversion.
const macCases: typeof windowsCases = [
  { preset: 'intellij', name: 'duplicate line', key: 'd', modifiers: { metaKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'alpha\nalpha\nbeta' },
  { preset: 'vscode', name: 'duplicate line', key: 'ArrowDown', modifiers: { shiftKey: true, altKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'alpha\nalpha\nbeta' },
  { preset: 'intellij', name: 'delete last line', key: 'Backspace', modifiers: { metaKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'alpha' },
  { preset: 'vscode', name: 'delete last line', key: 'k', modifiers: { metaKey: true, shiftKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'alpha' },
  { preset: 'intellij', name: 'move line down', key: 'ArrowDown', modifiers: { shiftKey: true, altKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'beta\nalpha' },
  { preset: 'vscode', name: 'move line down', key: 'ArrowDown', modifiers: { altKey: true }, code: 'alpha\nbeta', anchor: 0, expected: 'beta\nalpha' },
  { preset: 'intellij', name: 'move line up', key: 'ArrowUp', modifiers: { shiftKey: true, altKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'beta\nalpha' },
  { preset: 'vscode', name: 'move line up', key: 'ArrowUp', modifiers: { altKey: true }, code: 'alpha\nbeta', anchor: 6, expected: 'beta\nalpha' },
];

describe('IDE keymaps', () => {
  it.each(windowsCases)('$preset: $name matches the Windows target', ({ preset, key, modifiers, code, anchor, expected }) => {
    const view = createView(code, preset);
    view.dispatch({ selection: { anchor } });

    expect(press(view, key, modifiers)).toBe(true);
    expect(view.state.doc.toString()).toBe(expected);
    expect(press(view, 'z', { ctrlKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe(code);
  });

  it.each(macCases)('$preset: $name matches the explicit macOS map', ({ preset, key, modifiers, code, anchor, expected }) => {
    const view = createView(code, preset, true, 'macos');
    view.dispatch({ selection: { anchor } });
    expect(press(view, key, modifiers)).toBe(true);
    expect(view.state.doc.toString()).toBe(expected);
    expect(press(view, 'z', { metaKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe(code);
  });

  it.each(['intellij', 'vscode'] as const)('%s uses macOS Undo/Redo and line comment chords', (preset) => {
    const view = createView('alpha', preset, true, 'macos');
    view.dispatch({ changes: { from: 5, insert: '!' }, userEvent: 'input.type' });
    expect(press(view, 'z', { metaKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('alpha');
    expect(press(view, 'z', { metaKey: true, shiftKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('alpha!');
    expect(press(view, '/', { metaKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('// alpha!');
  });

  it.each(['intellij', 'vscode'] as const)('%s supports Undo and its own Redo chord', (preset) => {
    const view = createView('original', preset);
    view.dispatch({ changes: { from: 8, insert: '!' }, userEvent: 'input.type' });
    expect(press(view, 'z', { ctrlKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('original');
    expect(press(view, preset === 'intellij' ? 'z' : 'y', {
      ctrlKey: true, shiftKey: preset === 'intellij',
    })).toBe(true);
    expect(view.state.doc.toString()).toBe('original!');
  });

  it.each(['intellij', 'vscode'] as const)('%s undoes rapid line deletion separately from typing', (preset) => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      const { container } = render(
        <EditorSurface code="" settings={{ ...createInitialWorkspace().settings, keymap: preset }} onCodeChange={vi.fn()} />,
      );
      const editor = container.querySelector<HTMLElement>('.cm-editor');
      if (!editor) throw new Error('Expected editor DOM.');
      const view = EditorView.findFromDOM(editor);
      if (!view) throw new Error('Expected EditorView.');
      view.focus();
      act(() => view.dispatch({
        changes: { from: 0, insert: 'first\nsecond' },
        selection: { anchor: 12 },
        userEvent: 'input.type',
      }));
      expect(press(view, preset === 'intellij' ? 'y' : 'k', {
        ctrlKey: true, shiftKey: preset === 'vscode',
      })).toBe(true);
      expect(view.state.doc.toString()).toBe('first');
      expect(press(view, 'z', { ctrlKey: true })).toBe(true);
      expect(view.state.doc.toString()).toBe('first\nsecond');
      expect(press(view, preset === 'intellij' ? 'z' : 'y', {
        ctrlKey: true, shiftKey: preset === 'intellij',
      })).toBe(true);
      expect(view.state.doc.toString()).toBe('first');
    } finally {
      now.mockRestore();
    }
  });

  it.each(['intellij', 'vscode'] as const)('%s undoes rapid outdent separately from typing', (preset) => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      const { container } = render(
        <EditorSurface code="" settings={{ ...createInitialWorkspace().settings, keymap: preset }} onCodeChange={vi.fn()} />,
      );
      const editor = container.querySelector<HTMLElement>('.cm-editor');
      if (!editor) throw new Error('Expected editor DOM.');
      const view = EditorView.findFromDOM(editor);
      if (!view) throw new Error('Expected EditorView.');
      view.focus();
      act(() => view.dispatch({
        changes: { from: 0, insert: '  first' },
        selection: { anchor: 7 },
        userEvent: 'input.type',
      }));
      expect(press(view, 'Tab', { shiftKey: true })).toBe(true);
      expect(view.state.doc.toString()).toBe('first');
      expect(press(view, 'z', { ctrlKey: true })).toBe(true);
      expect(view.state.doc.toString()).toBe('  first');
    } finally {
      now.mockRestore();
    }
  });

  it.each(['intellij', 'vscode'] as const)('%s toggles comments when language data exists', (preset) => {
    const view = createView('alpha\nbeta', preset);
    view.dispatch({ selection: EditorSelection.single(0, 10) });

    expect(press(view, '/', { ctrlKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('// alpha\n// beta');
    expect(press(view, '/', { ctrlKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('alpha\nbeta');
  });

  it.each(['intellij', 'vscode'] as const)('%s leaves Plain Text comment input unchanged', (preset) => {
    const view = createView('plain text', preset, false);
    expect(press(view, '/', { ctrlKey: true })).toBe(false);
    expect(view.state.doc.toString()).toBe('plain text');
  });

  it.each(['intellij', 'vscode'] as const)('%s indents and outdents selected lines', (preset) => {
    const view = createView('alpha\nbeta', preset);
    view.dispatch({ selection: EditorSelection.single(0, 10) });
    expect(press(view, 'Tab')).toBe(true);
    expect(view.state.doc.toString()).toBe('  alpha\n  beta');
    expect(press(view, 'Tab', { shiftKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('alpha\nbeta');
  });

  it.each(['intellij', 'vscode'] as const)('%s duplicates a selected block of whole lines', (preset) => {
    const view = createView('alpha\nbeta\nlast', preset);
    view.dispatch({ selection: EditorSelection.single(0, 10) });
    press(view, preset === 'intellij' ? 'd' : 'ArrowDown', preset === 'intellij'
      ? { ctrlKey: true } : { altKey: true, shiftKey: true });
    expect(view.state.doc.toString()).toBe('alpha\nbeta\nalpha\nbeta\nlast');
  });

  it('does not replace native copy and cut with keyboard commands', () => {
    for (const preset of ['intellij', 'vscode'] as const) {
      const view = createView('alpha\nbeta', preset);
      expect(press(view, 'c', { ctrlKey: true })).toBe(false);
      expect(press(view, 'x', { ctrlKey: true })).toBe(false);
      expect(view.state.doc.toString()).toBe('alpha\nbeta');
    }
  });

  it('settings_input_is_not_editor', () => {
    const view = createView('alpha\nbeta', 'intellij');
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    try {
      expect(press(view, 'y', { ctrlKey: true })).toBe(false);
      expect(press(view, 'd', { ctrlKey: true })).toBe(false);
      expect(view.state.doc.toString()).toBe('alpha\nbeta');
    } finally {
      input.remove();
    }
  });

  it('does not run editing commands during an active composition', () => {
    const view = createView('alpha\nbeta', 'intellij');
    view.contentDOM.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(view.compositionStarted).toBe(true);
    expect(press(view, 'y', { ctrlKey: true, isComposing: true })).toBe(false);
    expect(view.state.doc.toString()).toBe('alpha\nbeta');
    view.contentDOM.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });

  it('switch_preserves_document_selection_history and removes old bindings', () => {
    const settings = { ...createInitialWorkspace().settings, keymap: 'intellij' as const };
    const onChange = vi.fn();
    const { container, rerender } = render(
      <EditorSurface code="alpha" settings={settings} onCodeChange={onChange} />,
    );
    const editor = container.querySelector<HTMLElement>('.cm-editor');
    if (!editor) throw new Error('Expected editor DOM.');
    const view = EditorView.findFromDOM(editor);
    if (!view) throw new Error('Expected EditorView.');
    view.focus();
    act(() => view.dispatch({ changes: { from: 5, insert: '!' }, selection: { anchor: 2 } }));
    rerender(<EditorSurface code="alpha!" settings={{ ...settings, keymap: 'vscode' }} onCodeChange={onChange} />);

    expect(EditorView.findFromDOM(editor)).toBe(view);
    expect(view.state.doc.toString()).toBe('alpha!');
    expect(view.state.selection.main.head).toBe(2);
    expect(press(view, 'd', { ctrlKey: true })).toBe(false);
    expect(view.state.doc.toString()).toBe('alpha!');
    expect(press(view, 'z', { ctrlKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('alpha');
    expect(press(view, 'y', { ctrlKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe('alpha!');
  });
});
