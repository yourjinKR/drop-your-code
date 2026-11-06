import { act, render, screen } from '@testing-library/react';
import { StrictMode, useReducer } from 'react';
import { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import { describe, expect, it, vi } from 'vitest';
import { EditorSurface } from '../../src/editor/EditorSurface';
import { createInitialWorkspace, workspaceReducer } from '../../src/state/workspace';

function viewIn(container: HTMLElement): EditorView {
  const element = container.querySelector<HTMLElement>('.cm-editor');
  if (!element) throw new Error('Editor DOM was not mounted.');
  const view = EditorView.findFromDOM(element);
  if (!view) throw new Error('EditorView was not mounted.');
  return view;
}

function WorkspaceHarness({ onChange }: { onChange: (code: string) => void }) {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, createInitialWorkspace);
  return (
    <>
      <EditorSurface
        code={state.document.code}
        settings={state.settings}
        onCodeChange={(code) => {
          onChange(code);
          dispatch({ type: 'codeChanged', code });
        }}
      />
      <output data-testid="common-code">{state.document.code}</output>
    </>
  );
}

describe('EditorSurface', () => {
  it('input_updates_workspace_once', () => {
    const onChange = vi.fn();
    const { container } = render(<WorkspaceHarness onChange={onChange} />);
    const view = viewIn(container);

    act(() => view.dispatch({ changes: { from: 0, insert: 'const value = 1;\n' } }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('const value = 1;\n');
    expect(screen.getByTestId('common-code').textContent).toBe('const value = 1;\n');
    expect(view.state.doc.toString()).toBe('const value = 1;\n');
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toHaveAttribute(
      'aria-describedby', 'editor-help',
    );
  });

  it('parent_echo_does_not_reset_selection_or_history', () => {
    const onChange = vi.fn();
    const settings = createInitialWorkspace().settings;
    const { container, rerender } = render(
      <EditorSurface code="start" settings={settings} onCodeChange={onChange} />,
    );
    const view = viewIn(container);
    act(() => view.dispatch({ changes: { from: 5, insert: 'abc' }, selection: { anchor: 8 } }));

    rerender(<EditorSurface code="startabc" settings={{ ...settings }} onCodeChange={onChange} />);

    expect(viewIn(container)).toBe(view);
    expect(view.state.selection.main.head).toBe(8);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('startabc');
    act(() => { expect(undo(view)).toBe(true); });
    expect(view.state.doc.toString()).toBe('start');
    expect(onChange).toHaveBeenLastCalledWith('start');
  });

  it('external_code_replacement_does_not_loop', () => {
    const onChange = vi.fn();
    const settings = createInitialWorkspace().settings;
    const { container, rerender } = render(
      <EditorSurface code="abcdef" settings={settings} onCodeChange={onChange} />,
    );
    const view = viewIn(container);
    act(() => view.dispatch({ selection: { anchor: 5, head: 6 } }));

    rerender(<EditorSurface code="x" settings={settings} onCodeChange={onChange} />);
    expect(viewIn(container)).toBe(view);
    expect(view.state.doc.toString()).toBe('x');
    expect(view.state.selection.main.anchor).toBeLessThanOrEqual(1);
    expect(view.state.selection.main.head).toBeLessThanOrEqual(1);
    expect(onChange).not.toHaveBeenCalled();

    act(() => view.dispatch({ selection: { anchor: 0 } }));
    rerender(<EditorSurface code="x" settings={settings} onCodeChange={onChange} />);
    expect(view.state.selection.main.head).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the latest callback without recreating the editor', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const settings = createInitialWorkspace().settings;
    const { container, rerender } = render(
      <EditorSurface code="" settings={settings} onCodeChange={first} />,
    );
    const view = viewIn(container);
    rerender(<EditorSurface code="" settings={settings} onCodeChange={latest} />);
    act(() => view.dispatch({ changes: { from: 0, insert: 'latest' } }));

    expect(viewIn(container)).toBe(view);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith('latest');
  });

  it('normalizes external CRLF without repeated updates and preserves final blank lines', () => {
    const onChange = vi.fn();
    const settings = createInitialWorkspace().settings;
    const { container, rerender } = render(
      <EditorSurface code={'first\r\nsecond\r\n\r\n'} settings={settings} onCodeChange={onChange} />,
    );
    const view = viewIn(container);
    expect(view.state.doc.toString()).toBe('first\nsecond\n\n');
    rerender(
      <EditorSurface code={'first\r\nsecond\r\n\r\n'} settings={settings} onCodeChange={onChange} />,
    );
    expect(viewIn(container)).toBe(view);
    expect(onChange).not.toHaveBeenCalled();
    act(() => view.dispatch({ changes: { from: 0, insert: '\t한글😀 ' } }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('\t한글😀 first\nsecond\n\n');
  });

  it('unmount_destroys_editor', () => {
    const { container, unmount } = render(
      <EditorSurface code="" settings={createInitialWorkspace().settings} onCodeChange={vi.fn()} />,
    );
    const view = viewIn(container);
    const destroy = vi.spyOn(view, 'destroy');

    unmount();

    expect(destroy).toHaveBeenCalledOnce();
    expect(container.querySelector('.cm-editor')).toBeNull();
  });

  it('cleans up StrictMode mount cycles without duplicate editors or callbacks', () => {
    const onChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <EditorSurface code="" settings={createInitialWorkspace().settings} onCodeChange={onChange} />
      </StrictMode>,
    );
    expect(container.querySelectorAll('.cm-editor')).toHaveLength(1);
    act(() => viewIn(container).dispatch({ changes: { from: 0, insert: 'once' } }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('once');
  });
});
