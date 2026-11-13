import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { downloadSnapshot, snapshotFilename } from '../../src/export/downloadSnapshot';
import { encodeSnapshot, SnapshotExportError } from '../../src/export/encodeSnapshot';
import type { SnapshotExportOptions } from '../../src/export/encodeSnapshot';
import { useSnapshotExport } from '../../src/export/useSnapshotExport';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { buildSnapshotModel } from '../../src/snapshot/model';
import type { SnapshotModel } from '../../src/snapshot/model';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';
import type { SnapshotInput } from '../../src/state/workspace';

vi.mock('../../src/snapshot/model', () => ({ buildSnapshotModel: vi.fn() }));
vi.mock('../../src/export/encodeSnapshot', { spy: true });
vi.mock('../../src/export/downloadSnapshot', { spy: true });

const initial = selectSnapshotInput(createInitialWorkspace());
const input = { ...initial, code: 'first', presentation: { ...initial.presentation, title: ' first / file ' } };
const model = layoutSnapshot(input, [], (text) => text.length * 8);
const png = new Blob(['png'], { type: 'image/png' });
const pngOptions = { format: 'png', scale: 2 } as const;

type Props = { input: SnapshotInput; preview: SnapshotModel | null; options: SnapshotExportOptions };
const renderOutput = (initialProps: Props) => renderHook(
  ({ input, preview, options }: Props) => useSnapshotExport(input, preview, options), { initialProps },
);

describe('image download', () => {
  it('captures the click input while editing and blocks a second request', async () => {
    const build = vi.mocked(buildSnapshotModel);
    let finish!: (value: SnapshotModel) => void;
    build.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    vi.mocked(encodeSnapshot).mockResolvedValueOnce(png);
    vi.mocked(downloadSnapshot).mockImplementation(() => {});
    const view = renderOutput({ input, preview: null, options: pngOptions });
    act(() => { void view.result.current.exportImage(); });
    expect(view.result.current.busy).toBe(true);
    view.rerender({ input: { ...input, code: 'second', revision: 1 }, preview: null, options: { format: 'svg' } });
    await act(async () => { await view.result.current.exportImage(); });
    expect(build).toHaveBeenCalledExactlyOnceWith(input);
    await act(async () => { finish(model); });
    expect(encodeSnapshot).toHaveBeenCalledExactlyOnceWith(model, pngOptions);
    expect(downloadSnapshot).toHaveBeenCalledExactlyOnceWith(png, 'first _ file.png');
    expect(view.result.current).toMatchObject({ busy: false, message: 'Download started.', error: '' });
  });

  it('reuses the current model and allows a retry after an error', async () => {
    vi.mocked(encodeSnapshot).mockRejectedValueOnce(new SnapshotExportError('Could not encode.')).mockResolvedValueOnce(png);
    vi.mocked(downloadSnapshot).mockImplementation(() => {});
    const view = renderOutput({ input, preview: model, options: pngOptions });
    await act(async () => { await view.result.current.exportImage(); });
    expect(view.result.current).toMatchObject({ busy: false, message: '', error: 'Could not encode.' });
    expect(downloadSnapshot).not.toHaveBeenCalled();
    await act(async () => { await view.result.current.exportImage(); });
    expect(downloadSnapshot).toHaveBeenCalledTimes(1);
    expect(buildSnapshotModel).not.toHaveBeenCalled();
    expect(view.result.current).toMatchObject({ busy: false, message: 'Download started.', error: '' });
  });

  it.each([['   ', 'untitled.svg'], ['..', 'untitled.svg'], ['CON.txt', '_CON.txt.svg'],
    ['한글:👩‍💻?.', '한글_👩_💻_.svg']])('sanitizes the filename for %s', (title, expected) => {
    expect(snapshotFilename(title, 'svg')).toBe(expected);
  });
});
