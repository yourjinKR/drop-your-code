import { afterEach, describe, expect, it, vi } from 'vitest';
import { copySnapshotPng } from '../../src/export/copyPng';

const png = new Blob(['png'], { type: 'image/png' });

class TestClipboardItem {
  constructor(readonly data: Record<string, Promise<Blob>>) {}
}

function mockClipboard() {
  const write = vi.fn(async ([item]: TestClipboardItem[]) => { await item!.data['image/png']; });
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('ClipboardItem', TestClipboardItem);
  vi.stubGlobal('navigator', { clipboard: { write } });
  return write;
}

afterEach(() => vi.unstubAllGlobals());

describe('PNG clipboard', () => {
  it('starts the write immediately and waits for the image and clipboard to finish', async () => {
    const write = mockClipboard();
    let encode!: (blob: Blob) => void;
    let finish!: () => void;
    const createPng = vi.fn(() => new Promise<Blob>((resolve) => { encode = resolve; }));
    write.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const copied = vi.fn();
    const pending = copySnapshotPng(createPng).then(copied);
    expect(write).toHaveBeenCalledTimes(1);
    const data = write.mock.calls[0]![0][0]!.data;
    expect(Object.keys(data)).toEqual(['image/png']);
    await Promise.resolve();
    encode(png);
    await expect(data['image/png']).resolves.toBe(png);
    expect(copied).not.toHaveBeenCalled();
    finish();
    await pending;
    expect(copied).toHaveBeenCalledTimes(1);
  });

  it('requires a secure page before starting work', async () => {
    const write = mockClipboard();
    vi.stubGlobal('isSecureContext', false);
    const createPng = vi.fn();
    await expect(copySnapshotPng(createPng)).rejects.toThrow('Image copying requires a secure page. Export a PNG instead.');
    expect(write).not.toHaveBeenCalled();
    expect(createPng).not.toHaveBeenCalled();
  });

  it.each(['ClipboardItem', 'navigator'] as const)('reports when %s does not provide image clipboard support', async (name) => {
    mockClipboard();
    vi.stubGlobal(name, name === 'navigator' ? {} : undefined);
    const createPng = vi.fn();
    await expect(copySnapshotPng(createPng)).rejects.toThrow('Image copying is unavailable in this browser. Export a PNG instead.');
    expect(createPng).not.toHaveBeenCalled();
  });

  it('reports permission denial without retrying the clipboard write', async () => {
    const write = mockClipboard();
    write.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    await expect(copySnapshotPng(async () => png)).rejects.toThrow('Could not copy the image. Export a PNG instead.');
    expect(write).toHaveBeenCalledTimes(1);
  });

  it.each([
    async () => new Blob(['svg'], { type: 'image/svg+xml' }),
    async () => { throw new Error('failed to encode'); },
  ])('reports a PNG preparation failure', async (createPng) => {
    mockClipboard();
    await expect(copySnapshotPng(createPng)).rejects.toThrow('Could not prepare a PNG to copy. Export a PNG instead.');
  });
});
