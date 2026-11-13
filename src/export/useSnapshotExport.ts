import { useRef, useState } from 'react';
import type { SnapshotModel } from '../snapshot/model';
import { buildSnapshotModel } from '../snapshot/model';
import type { SnapshotInput } from '../state/workspace';
import { downloadSnapshot, snapshotFilename } from './downloadSnapshot';
import { encodeSnapshot, SnapshotExportError } from './encodeSnapshot';
import type { SnapshotExportOptions } from './encodeSnapshot';

export function useSnapshotExport(input: SnapshotInput, preview: SnapshotModel | null, options: SnapshotExportOptions) {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function exportImage() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const model = preview ?? await buildSnapshotModel(input).catch(() => {
        throw new SnapshotExportError('Could not prepare the snapshot. Try again.');
      });
      const blob = await encodeSnapshot(model, options);
      downloadSnapshot(blob, snapshotFilename(input.presentation.title, options.format));
      setMessage('Download started.');
    } catch (cause) {
      setError(cause instanceof SnapshotExportError ? cause.message : 'Could not export the image. Try again.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { exportImage, busy, message, error };
}
