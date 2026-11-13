import { useRef, useState } from 'react';
import type { SnapshotModel } from '../snapshot/model';
import { buildSnapshotModel } from '../snapshot/model';
import type { SnapshotInput } from '../state/workspace';
import { copySnapshotPng } from './copyPng';
import { downloadSnapshot, snapshotFilename } from './downloadSnapshot';
import { DEFAULT_RASTER_SCALE, encodeSnapshot, SnapshotExportError } from './encodeSnapshot';
import type { SnapshotExportOptions } from './encodeSnapshot';

type OutputAction = 'export' | 'copy';

export function useSnapshotExport(input: SnapshotInput, preview: SnapshotModel | null, options: SnapshotExportOptions) {
  const running = useRef(false);
  const [action, setAction] = useState<OutputAction | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function createImage(output: SnapshotExportOptions) {
    const model = preview ?? await buildSnapshotModel(input).catch(() => {
      throw new SnapshotExportError('Could not prepare the snapshot. Try again.');
    });
    return encodeSnapshot(model, output);
  }

  async function run(next: OutputAction) {
    if (running.current) return;
    running.current = true;
    setAction(next);
    setMessage('');
    setError('');
    try {
      if (next === 'copy') {
        await copySnapshotPng(() => createImage({ format: 'png', scale: DEFAULT_RASTER_SCALE }));
        setMessage('Image copied.');
      } else {
        const blob = await createImage(options);
        downloadSnapshot(blob, snapshotFilename(input.presentation.title, options.format));
        setMessage('Download started.');
      }
    } catch (cause) {
      setError(cause instanceof SnapshotExportError ? cause.message : next === 'copy'
        ? 'Could not copy the image. Export a PNG instead.'
        : 'Could not export the image. Try again.');
    } finally {
      running.current = false;
      setAction(null);
    }
  }

  return { exportImage: () => run('export'), copyImage: () => run('copy'), action, busy: action !== null, message, error };
}
