import { act, fireEvent, render, screen } from '@testing-library/react';
import { undo } from '@codemirror/commands';
import { LanguageSupport, StreamLanguage, language } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { loadLanguage } from '../../src/editor/languages';

vi.mock('../../src/editor/languages', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../src/editor/languages')>(),
  loadLanguage: vi.fn(),
}));

function openEditor() {
  render(<App />);
  const view = EditorView.findFromDOM(screen.getByRole('textbox', { name: 'Code editor' }));
  if (!view) throw new Error('Editor not mounted');
  const select = screen.getByRole('combobox', { name: 'Language' });
  return {
    view,
    select,
    choose: (id: string) => fireEvent.change(select, { target: { value: id } }),
    status: screen.getByRole('status', { name: 'Editor status' }),
  };
}

function support(name: string) {
  return new LanguageSupport(StreamLanguage.define({ name, token: (stream) => {
    stream.skipToEnd();
    return null;
  } }));
}

const mockLoad = vi.mocked(loadLanguage);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe('manual language selection', () => {
  beforeEach(() => mockLoad.mockReset());

  it.each(['resolves', 'rejects'])('keeps the newer language when an older load %s late', async (result) => {
    const java = deferred<LanguageSupport>();
    const python = deferred<LanguageSupport>();
    mockLoad.mockReturnValueOnce(java.promise).mockReturnValueOnce(python.promise);
    const { choose, view, status } = openEditor();

    choose('java');
    expect(screen.getByText('Loading Java…')).toBeVisible();
    expect(status).toHaveTextContent('Plain Text');
    act(() => view.dispatch({ changes: { from: 0, insert: '한글' }, selection: { anchor: 0, head: 2 } }));
    choose('python');
    await act(async () => python.resolve(support('python')));
    await act(async () => {
      if (result === 'resolves') java.resolve(support('java'));
      else java.reject(new Error('offline'));
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(status).toHaveTextContent('Python');
    expect(view.state.facet(language)?.name).toBe('python');
    expect(view.state.doc.toString()).toBe('한글');
    expect(view.state.selection.main).toMatchObject({ anchor: 0, head: 2 });
    act(() => { expect(undo(view)).toBe(true); });
    expect(view.state.doc.toString()).toBe('');
  });

  it('keeps the applied language and code on failure and supports retry', async () => {
    mockLoad.mockResolvedValueOnce(support('java'))
      .mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(support('python'));
    const { choose, select, view, status } = openEditor();

    await act(async () => { choose('java'); });
    act(() => view.dispatch({ changes: { from: 0, insert: 'unchanged' } }));
    await act(async () => { choose('python'); });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load Python.');
    expect(select).toHaveValue('java');
    expect(status).toHaveTextContent('Java');
    expect(view.state.facet(language)?.name).toBe('java');
    expect(view.state.doc.toString()).toBe('unchanged');

    const retry = screen.getByRole('button', { name: 'Retry' });
    retry.focus();
    await act(async () => { fireEvent.click(retry); });
    expect(select).toHaveFocus();
    expect(select).toHaveValue('python');
    expect(view.state.facet(language)?.name).toBe('python');
    expect(view.state.doc.toString()).toBe('unchanged');
    expect(mockLoad.mock.calls).toEqual([['java'], ['python'], ['python']]);
  });
});
