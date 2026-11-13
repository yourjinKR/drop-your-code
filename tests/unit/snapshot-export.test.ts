import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RASTER_SCALE, encodeSnapshot } from '../../src/export/encodeSnapshot';
import { layoutSnapshot } from '../../src/snapshot/layout';
import { createInitialWorkspace, selectSnapshotInput } from '../../src/state/workspace';

const input = selectSnapshotInput(createInitialWorkspace());
const snapshot = { ...layoutSnapshot(input, [], (text) => text.length * 8), width: 888, height: 496 };

function mockRaster() {
  const drawImage = vi.fn();
  const decode = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  vi.stubGlobal('Image', class { src = ''; decode = decode; });
  const png = new Blob(['png'], { type: 'image/png' });
  const createUrl = vi.fn((_blob: Blob) => 'blob:snapshot');
  const revokeUrl = vi.fn();
  vi.stubGlobal('URL', class extends URL {
    static override createObjectURL = createUrl;
    static override revokeObjectURL = revokeUrl;
  });
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    .mockImplementation((callback) => callback(png));
  return { drawImage, decode, png, createUrl, revokeUrl, getContext, toBlob };
}

afterEach(() => vi.unstubAllGlobals());

describe('snapshot encoder', () => {
  it('creates a standalone SVG using logical dimensions', async () => {
    const blob = await encodeSnapshot(snapshot, { format: 'svg' });
    expect(blob.type).toBe('image/svg+xml');
    expect(await blob.text()).toContain('width="888" height="496" viewBox="0 0 888 496"');
    expect(DEFAULT_RASTER_SCALE).toBe(2);
  });

  it.each([1, 2, 3, 4] as const)('rasterizes PNG at %sx with the same viewBox', async (scale) => {
    const { drawImage, png, createUrl, revokeUrl, toBlob } = mockRaster();
    const width = 888 * scale;
    const height = 496 * scale;
    await expect(encodeSnapshot(snapshot, { format: 'png', scale })).resolves.toBe(png);
    expect(await createUrl.mock.calls[0]![0].text()).toContain(`width="${width}" height="${height}" viewBox="0 0 888 496"`);
    expect(drawImage).toHaveBeenCalledWith(expect.any(Image), 0, 0, width, height);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(revokeUrl).toHaveBeenCalledWith('blob:snapshot');
    expect(toBlob.mock.contexts[0]).toMatchObject({ width: 0, height: 0 });
  });

  it.each([0, -1, NaN, Infinity, 1.5])('rejects an invalid logical width of %s', async (width) => {
    await expect(encodeSnapshot({ ...snapshot, width }, { format: 'svg' })).rejects.toThrow(/invalid dimensions/);
  });

  it.each([[8193, 1], [3000, 3000]])('rejects an oversized canvas for %s by %s', async (width, height) => {
    const createElement = vi.spyOn(document, 'createElement');
    await expect(encodeSnapshot({ ...snapshot, width, height }, { format: 'png', scale: 2 })).rejects.toThrow(/too large/);
    expect(createElement).not.toHaveBeenCalled();
  });

  it('reports an unavailable canvas', async () => {
    const { getContext, createUrl } = mockRaster();
    getContext.mockReturnValue(null);
    await expect(encodeSnapshot(snapshot, { format: 'png', scale: 2 })).rejects.toThrow(/could not create an image canvas/);
    expect(createUrl).not.toHaveBeenCalled();
  });

  it('releases the SVG URL on decode failure', async () => {
    const { decode, revokeUrl, toBlob } = mockRaster();
    decode.mockRejectedValueOnce(new Error('failed'));
    await expect(encodeSnapshot(snapshot, { format: 'png', scale: 2 })).rejects.toThrow(/Could not render/);
    expect(revokeUrl).toHaveBeenCalledWith('blob:snapshot');
    expect(toBlob).not.toHaveBeenCalled();
  });

  it.each([null, new Blob(['wrong'], { type: 'image/jpeg' })])('rejects invalid PNG encoder results', async (result) => {
    const { toBlob, revokeUrl } = mockRaster();
    toBlob.mockImplementationOnce((callback) => callback(result));
    await expect(encodeSnapshot(snapshot, { format: 'png', scale: 2 })).rejects.toThrow(/Could not encode a PNG/);
    expect(revokeUrl).toHaveBeenCalledWith('blob:snapshot');
  });
});
