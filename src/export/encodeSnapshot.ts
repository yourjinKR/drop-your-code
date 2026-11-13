import type { SnapshotModel } from '../snapshot/model';
import { renderSnapshotSvg } from '../snapshot/renderSvg';

export type RasterScale = 1 | 2 | 3 | 4;
export type SnapshotExportOptions = { format: 'svg' } | { format: 'png'; scale: RasterScale };
export const DEFAULT_RASTER_SCALE: RasterScale = 2;

const maxCanvasSide = 16_384;
// Limit the RGBA canvas alone to 128 MiB, before SVG and encoder buffers.
const maxCanvasPixels = 32 * 1024 * 1024;

export class SnapshotExportError extends Error {}

export async function encodeSnapshot(model: SnapshotModel, options: SnapshotExportOptions): Promise<Blob> {
  const { width, height } = model;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new SnapshotExportError('The snapshot has invalid dimensions.');
  }
  if (options.format === 'svg') {
    return new Blob([renderSnapshotSvg(model)], { type: 'image/svg+xml' });
  }

  const pixelWidth = width * options.scale;
  const pixelHeight = height * options.scale;
  if (pixelWidth > maxCanvasSide || pixelHeight > maxCanvasSide || pixelWidth * pixelHeight > maxCanvasPixels) {
    throw new SnapshotExportError('The snapshot is too large for raster export. Choose SVG or shorten the snapshot.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new SnapshotExportError('The browser could not create an image canvas. Choose SVG or try again.');

    const image = new Image();
    const source = renderSnapshotSvg(model, { width: pixelWidth, height: pixelHeight });
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
    try {
      image.src = url;
      await image.decode().catch(() => {
        throw new SnapshotExportError('Could not render the snapshot for export. Try again.');
      });
      context.drawImage(image, 0, 0, pixelWidth, pixelHeight);
    } finally {
      URL.revokeObjectURL(url);
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob?.type !== 'image/png') throw new SnapshotExportError('Could not encode a PNG image. Choose SVG or try again.');
    return blob;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
