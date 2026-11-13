import { EditorView } from '@codemirror/view';
import { redo, undo } from '@codemirror/commands';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import * as workspaceState from '../../src/state/workspace';

function renderEditor() {
  render(<App />);
  const editor = screen.getByRole('textbox', { name: 'Code editor' });
  const view = EditorView.findFromDOM(editor);
  if (!view) throw new Error('Expected CodeMirror editor');
  return { editor, view };
}

function edit(view: EditorView, code: string) {
  act(() => view.dispatch({ changes: { from: 0, insert: code }, selection: { anchor: 0, head: 4 } }));
}

describe('editor appearance settings', () => {
  it('theme_preserves_document_history', () => {
    const { editor, view } = renderEditor();
    const code = 'const message = "한글";';
    edit(view, code);
    expect(view.state.facet(EditorView.darkTheme)).toBe(true);

    const select = screen.getByRole('combobox', { name: 'Syntax theme' });
    select.focus();
    fireEvent.change(select, { target: { value: 'light' } });
    expect(select).toHaveFocus();
    expect(EditorView.findFromDOM(editor)).toBe(view);
    expect(view.state.facet(EditorView.darkTheme)).toBe(false);
    expect(view.state.doc.toString()).toBe(code);
    expect(view.state.selection.main).toMatchObject({ anchor: 0, head: 4 });
    act(() => { expect(undo(view)).toBe(true); });
    expect(view.state.doc.toString()).toBe('');
    act(() => { expect(redo(view)).toBe(true); });
    expect(view.state.doc.toString()).toBe(code);
  });

  it('line_numbers_and_wrap_change_only_presentation', () => {
    const { editor, view } = renderEditor();
    const code = 'const text = "한글";\n\n';
    edit(view, code);
    const original = view.state.doc;
    expect(view.dom.querySelector('.cm-lineNumbers')).toBeNull();
    expect(view.contentDOM).not.toHaveClass('cm-lineWrapping');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Line numbers' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Wrap lines' }));
    expect(view.dom.querySelector('.cm-lineNumbers')).not.toBeNull();
    expect(view.contentDOM).toHaveClass('cm-lineWrapping');
    expect(view.state.doc).toBe(original);
    expect(view.state.selection.main).toMatchObject({ anchor: 0, head: 4 });
    expect(EditorView.findFromDOM(editor)).toBe(view);
    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveTextContent('3 lines');
    act(() => { expect(undo(view)).toBe(true); });
    expect(view.state.doc.toString()).toBe('');
  });

  it('ui_theme_does_not_change_syntax_or_snapshot_input', () => {
    const reducer = vi.spyOn(workspaceState, 'workspaceReducer');
    try {
      const { editor, view } = renderEditor();
      edit(view, 'const message = "hello";');
      fireEvent.click(screen.getByRole('checkbox', { name: 'Line numbers' }));
      const before = reducer.mock.results.at(-1)?.value;
      const input = workspaceState.selectSnapshotInput(before);
      const count = reducer.mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
      expect(document.documentElement).toHaveAttribute('data-ui-theme', 'light');
      expect(screen.getByRole('combobox', { name: 'Syntax theme' })).toHaveValue('dark');
      expect(view.state.facet(EditorView.darkTheme)).toBe(true);
      expect(EditorView.findFromDOM(editor)).toBe(view);
      expect(reducer).toHaveBeenCalledTimes(count);
      expect(workspaceState.selectSnapshotInput(reducer.mock.results.at(-1)?.value)).toEqual(input);
    } finally {
      reducer.mockRestore();
    }
  });
});
