import type { SnapshotExportOptions } from './encodeSnapshot';

export function snapshotFilename(title: string, format: SnapshotExportOptions['format']): string {
  const safe = Array.from(title.trim().replace(/[<>:"/\\|?*\p{Cc}\p{Cf}]/gu, '_')).slice(0, 80).join('')
    .replace(/^[. ]+|[. ]+$/g, '') || 'untitled';
  const reserved = /^(?:CON|PRN|AUX|NUL|(?:COM|LPT)[1-9¹²³])\s*(?:\.|$)/i.test(safe);
  return `${reserved ? '_' : ''}${safe}.${format}`;
}

export function downloadSnapshot(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  try {
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    // Let the browser start consuming the URL after the click returns.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
