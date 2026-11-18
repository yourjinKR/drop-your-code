import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { useSnapshotModel } from '../../src/snapshot/useSnapshotModel';
import { buildSnapshotModel } from '../../src/snapshot/model';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';
import type { SnapshotInput } from '../../src/state/workspace';

vi.mock('../../src/snapshot/model', () => ({ buildSnapshotModel: vi.fn() }));

const initial = selectSnapshotInput(createInitialWorkspace());
const modelFor = (input: SnapshotInput) => layoutSnapshot(input, [], (text) => text.length * 8);

describe('snapshot model requests', () => {
  it('discards stale results and keeps the last good model available through a retry', async () => {
    const requests: Array<{ resolve: (model: ReturnType<typeof modelFor>) => void; reject: (error: Error) => void }> = [];
    vi.mocked(buildSnapshotModel).mockImplementation(() => new Promise((resolve, reject) => requests.push({ resolve, reject })));
    const light = { ...initial, themeId: 'light' as const };
    const last = { ...light, code: 'latest', revision: 1 };
    const { result, rerender } = renderHook(useSnapshotModel, { initialProps: initial });

    await waitFor(() => expect(requests).toHaveLength(1));
    rerender(light);
    await waitFor(() => expect(requests).toHaveLength(2));
    await act(async () => requests[1]!.resolve(modelFor(light)));
    await act(async () => requests[0]!.resolve(modelFor(initial)));
    expect(result.current).toMatchObject({ status: 'ready', model: { theme: { background: '#ffffff' } } });

    rerender(last);
    await waitFor(() => expect(requests).toHaveLength(3));
    await act(async () => requests[2]!.reject(new Error('Failed to lay out snapshot')));
    expect(result.current).toMatchObject({ status: 'error', model: { revision: 0 } });
    act(() => result.current.retry());
    await waitFor(() => expect(requests).toHaveLength(4));
    await act(async () => requests[3]!.resolve(modelFor(last)));
    expect(result.current).toMatchObject({ status: 'ready', model: { revision: 1 } });
  });
});
