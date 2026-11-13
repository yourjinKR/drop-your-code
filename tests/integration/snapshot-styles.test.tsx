import { undo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { buildSnapshotModel } from '../../src/snapshot/model';
import { snapshotFonts } from '../../src/snapshot/presentation';

vi.mock('../../src/snapshot/model', () => ({ buildSnapshotModel: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

it('commits valid style, preserves invalid drafts, and leaves editor selection and history intact', async () => {
  vi.mocked(buildSnapshotModel).mockImplementation(async (input) => layoutSnapshot(input, [], (text) => text.length * 8));
  render(<App />);
  const editor = screen.getByRole('textbox', { name: 'Code editor' });
  const view = EditorView.findFromDOM(editor)!;
  act(() => view.dispatch({ changes: { from: 0, insert: 'original' }, selection: { anchor: 2, head: 6 } }));
  const typography = screen.getByText('Typography', { selector: 'summary' });
  expect(typography.parentElement).not.toHaveAttribute('open');
  fireEvent.click(typography);
  const fontSize = screen.getByRole('textbox', { name: 'Font size' });
  expect(screen.getByRole('combobox', { name: 'Font' })).toHaveAccessibleDescription(/Font stack: Consolas/);
  expect(screen.getByRole('combobox', { name: 'Font' })).toHaveValue('default');
  await waitFor(() => expect(buildSnapshotModel).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'original' }), expect.anything()));
  const lastCall = vi.mocked(buildSnapshotModel).mock.calls.length;
  fireEvent.change(fontSize, { target: { value: '99' } });
  fireEvent.blur(fontSize);
  expect(screen.getByRole('alert')).toHaveTextContent('Enter 10–32 px');
  expect(fontSize).toHaveValue('99');
  expect(editor.closest('.code-window')).toHaveStyle('--code-font-size: 14px');
  expect(buildSnapshotModel).toHaveBeenCalledTimes(lastCall);
  fireEvent.change(fontSize, { target: { value: '24' } });
  fireEvent.keyDown(fontSize, { key: 'Enter' });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(editor.closest('.code-window')).toHaveStyle('--code-font-size: 24px');
  await waitFor(() => expect(buildSnapshotModel).toHaveBeenLastCalledWith(expect.objectContaining({
    code: 'original', revision: 1, presentation: expect.objectContaining({ fontSize: 24, fontId: 'default' }),
  }), expect.anything()));
  fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
  expect(editor.closest('.code-window')).toHaveStyle(`--code-font: ${snapshotFonts.default.family}`);
  expect(editor.closest('.code-window')).toHaveAttribute('data-syntax-theme', 'dark');
  expect(EditorView.findFromDOM(editor)).toBe(view);
  expect(view.state.selection.main.from).toBe(2);
  expect(view.state.selection.main.to).toBe(6);
  act(() => { expect(undo(view)).toBe(true); });
  expect(view.state.doc.toString()).toBe('');
});
