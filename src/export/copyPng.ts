import { SnapshotExportError } from './encodeSnapshot';

const fallback = 'Export a PNG instead.';

export async function copySnapshotPng(createPng: () => Promise<Blob>): Promise<void> {
  if (!globalThis.isSecureContext) {
    throw new SnapshotExportError(`Image copying requires a secure page. ${fallback}`);
  }
  const clipboard = navigator.clipboard;
  if (typeof clipboard?.write !== 'function' || typeof ClipboardItem !== 'function') {
    throw new SnapshotExportError(`Image copying is unavailable in this browser. ${fallback}`);
  }

  const png = Promise.resolve().then(createPng).then((blob) => {
    if (blob.type !== 'image/png') throw new Error('Invalid clipboard image MIME.');
    return blob;
  });
  // Start the write while the click still provides user activation. Encoding can finish later.
  let write: Promise<void>;
  try {
    write = clipboard.write([new ClipboardItem({ 'image/png': png })]);
  } catch (error) {
    write = Promise.reject(error);
  }
  const [image, result] = await Promise.allSettled([png, write]);
  if (image.status === 'rejected') {
    const reason = image.reason;
    const detail = reason instanceof SnapshotExportError ? reason.message : fallback;
    throw new SnapshotExportError(`Could not prepare a PNG to copy. ${detail}`);
  }
  if (result.status === 'rejected') {
    throw new SnapshotExportError(`Could not copy the image. ${fallback}`);
  }
}
