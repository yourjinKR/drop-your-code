import { EditorView } from '@codemirror/view';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('app foundation', () => {
  it('mounts a real editor with an English keyboard entry point and passive status', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Drop Your Code' })).toBeVisible();
    const workspace = screen.getByRole('main', { name: 'Editor' });
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
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /copy|export|history|preview/i }),
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
});
