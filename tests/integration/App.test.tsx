import { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('app foundation', () => {
  it('mounts a real editor with an English keyboard entry point and passive status', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Drop Your Code' })).toBeVisible();
    const workspace = screen.getByRole('main', { name: 'Workspace' });
    expect(workspace).toHaveAttribute('id', 'workspace');
    expect(workspace).toHaveAttribute('tabindex', '-1');
    const editor = screen.getByRole('textbox', { name: 'Code editor' });
    expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(editor).toHaveAttribute('aria-describedby', 'editor-help');
    expect(editor).not.toHaveFocus();
    expect(screen.getByRole('link', { name: 'Skip to editor' })).toHaveAttribute(
      'href',
      '#workspace',
    );
    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveAttribute('aria-live', 'off');
    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveTextContent('Plain Text');
    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveTextContent('1 line');
    expect(screen.getByRole('complementary', { name: 'Properties' })).toContainElement(
      screen.getByRole('combobox', { name: 'Language' }),
    );
    expect(screen.getByRole('combobox', { name: 'Keymap' })).toHaveValue('vscode');
    expect(screen.getByRole('combobox', { name: 'Keymap' })).toHaveAccessibleDescription(
      /browser and system shortcuts may take priority/i,
    );
    expect(
      screen.queryByRole('button', { name: /copy|export|history/i }),
    ).not.toBeInTheDocument();
  });

  it('updates the line count from the shared document after an editor transaction', () => {
    render(<App />);
    const editor = screen.getByRole('textbox', { name: 'Code editor' });
    const view = EditorView.findFromDOM(editor);
    if (!view) throw new Error('Expected a CodeMirror editor view.');

    act(() => {
      view.dispatch({ changes: { from: 0, insert: 'first\nsecond\n' } });
    });

    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveTextContent('3 lines');
    expect(view.state.doc.toString()).toBe('first\nsecond\n');
  });

  it('changes the keymap through shared settings without moving focus or replacing the editor', () => {
    render(<App />);
    const editor = screen.getByRole('textbox', { name: 'Code editor' });
    const view = EditorView.findFromDOM(editor);
    if (!view) throw new Error('Expected a CodeMirror editor view.');
    act(() => {
      view.dispatch({ changes: { from: 0, insert: 'first\nsecond' }, selection: { anchor: 3 } });
    });
    const keymap = screen.getByRole('combobox', { name: 'Keymap' });
    keymap.focus();

    fireEvent.change(keymap, { target: { value: 'intellij' } });

    expect(keymap).toHaveValue('intellij');
    expect(keymap).toHaveFocus();
    expect(EditorView.findFromDOM(editor)).toBe(view);
    expect(view.state.doc.toString()).toBe('first\nsecond');
    expect(view.state.selection.main.head).toBe(3);
    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveTextContent('2 lines');
    act(() => { expect(undo(view)).toBe(true); });
    expect(view.state.doc.toString()).toBe('');
    expect(screen.getByRole('status', { name: 'Editor status' })).toHaveTextContent('1 line');
  });
});
