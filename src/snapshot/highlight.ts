import { loadLanguage } from '../editor/languages';
import type { SnapshotInput } from '../state/workspace';
import type { HighlightSpan } from '../theme/syntaxHighlighting';

export async function highlightSnapshot(input: SnapshotInput, signal?: AbortSignal): Promise<readonly HighlightSpan[]> {
  if (!input.code || input.languageId === 'plaintext') return [];
  const language = await loadLanguage(input.languageId);
  signal?.throwIfAborted();
  return language?.highlight(input.code.replace(/\r\n?/g, '\n'), input.themeId) ?? [];
}
