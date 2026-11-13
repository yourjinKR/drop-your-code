import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { SnapshotPreview } from '../../src/snapshot/SnapshotPreview';
import { useSnapshotModel } from '../../src/snapshot/useSnapshotModel';
import { buildSnapshotModel } from '../../src/snapshot/model';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';
import type { SnapshotInput } from '../../src/state/workspace';

vi.mock('../../src/snapshot/model', () => ({ buildSnapshotModel: vi.fn() }));

const initial = selectSnapshotInput(createInitialWorkspace());
const modelFor = (input: SnapshotInput) => layoutSnapshot(input, [], (text) => text.length * 8);
function Preview({ input }: { input: SnapshotInput }) {
  const snapshot = useSnapshotModel(input);
  return <SnapshotPreview {...snapshot} active zoom={null} onDisplay={() => {}} />;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(buildSnapshotModel).mockReset();
});

describe('preview requests', () => {
  it('discards out-of-order models and image decodes and retries with the last good image visible', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const scrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = vi.fn();
    const decodes = new Map<string, { resolve: () => void; reject: () => void }>();
    vi.stubGlobal('Image', class {
      src = '';
      decode() {
        return new Promise<void>((resolve, reject) => decodes.set(this.src, { resolve, reject }));
      }
    });
    let count = 0;
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = () => `blob:snapshot-${++count}`;
      static override revokeObjectURL = vi.fn();
    });
    const requests: ((value: ReturnType<typeof modelFor>) => void)[] = [];
    vi.mocked(buildSnapshotModel).mockImplementation(() => new Promise((resolve) => requests.push(resolve)));
    try {
      const light = { ...initial, themeId: 'light' as const };
      const latest = { ...light, code: 'latest', revision: 1 };
      const last = { ...light, code: 'last', revision: 2 };
      const view = render(<Preview input={initial} />);
      await waitFor(() => expect(requests).toHaveLength(1));
      view.rerender(<Preview input={light} />);
      await waitFor(() => expect(requests).toHaveLength(2));
      await act(async () => requests[1]!(modelFor(light)));
      await act(async () => requests[0]!(modelFor(initial)));
      expect(decodes.size).toBe(1);
      view.rerender(<Preview input={latest} />);
      await waitFor(() => expect(requests).toHaveLength(3));
      await act(async () => requests[2]!(modelFor(latest)));
      await act(async () => decodes.get('blob:snapshot-2')!.resolve());
      await act(async () => decodes.get('blob:snapshot-1')!.resolve());
      expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:snapshot-2');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:snapshot-1');

      view.rerender(<Preview input={last} />);
      await waitFor(() => expect(requests).toHaveLength(4));
      await act(async () => requests[3]!(modelFor(last)));
      await act(async () => decodes.get('blob:snapshot-3')!.reject());
      expect(screen.getByRole('alert')).toHaveTextContent('Showing the last preview');
      expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:snapshot-2');
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await waitFor(() => expect(requests).toHaveLength(5));
      await act(async () => requests[4]!(modelFor(last)));
      await act(async () => decodes.get('blob:snapshot-4')!.resolve());
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:snapshot-4');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:snapshot-2');
      view.unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:snapshot-4');
    } finally {
      HTMLElement.prototype.scrollTo = scrollTo;
    }
  });
});
