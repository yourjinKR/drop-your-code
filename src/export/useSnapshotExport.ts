import { useRef, useState } from 'react';
import type { SnapshotModel } from '../snapshot/model';
import { buildSnapshotModel } from '../snapshot/model';
import type { SnapshotInput } from '../state/workspace';
import { copySnapshotPng } from './copyPng';
import { downloadSnapshot, snapshotFilename } from './downloadSnapshot';
import { encodeSnapshot, SnapshotExportError } from './encodeSnapshot';
import type { SnapshotExportOptions } from './encodeSnapshot';

type OutputRequest = { type: 'export'; options: SnapshotExportOptions } | { type: 'copy' };

export function useSnapshotExport(
  input: SnapshotInput,
  preview: SnapshotModel | null,
  options: SnapshotExportOptions,
) {
  const running = useRef(false);
  const [action, setAction] = useState<OutputRequest['type'] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function createImage(output: SnapshotExportOptions) {
    const model = preview ?? await buildSnapshotModel(input).catch(() => {
      throw new SnapshotExportError('Could not prepare the snapshot. Try again.');
    });
    return encodeSnapshot(model, output);
  }

  async function run(request: OutputRequest) {
    if (running.current) return;
    running.current = true;
    setAction(request.type);
    setMessage('');
    setError('');
    try {
      if (request.type === 'copy') {
        await copySnapshotPng(() => createImage({ format: 'png', scale: 4 }));
        setMessage('Image copied.');
      } else {
        const blob = await createImage(request.options);
        downloadSnapshot(blob, snapshotFilename(input.presentation.title, request.options.format));
        setMessage('Download started.');
      }
    } catch (cause) {
      setError(cause instanceof SnapshotExportError ? cause.message : request.type === 'copy'
        ? 'Could not copy the image. Export a PNG instead.'
        : 'Could not export the image. Try again.');
    } finally {
      running.current = false;
      setAction(null);
    }
  }

  return {
    exportImage: (requestedOptions = options) => run({ type: 'export', options: requestedOptions }),
    copyImage: () => run({ type: 'copy' }),
    action,
    busy: action !== null,
    message,
    error,
  };
}
