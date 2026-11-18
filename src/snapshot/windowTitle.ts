import { languages } from '../editor/languages';
import type { LanguageId } from '../state/workspace';

export function formatWindowTitle(title: string, languageId: LanguageId): string {
  const name = title.trimEnd();
  if (!name) return '';

  const { extension } = languages[languageId];
  if (!extension || /\.[\p{L}\p{N}][\p{L}\p{N}_+-]*$/u.test(name)) return title;

  const separator = name.endsWith('.') ? '' : '.';
  return name + separator + extension + title.slice(name.length);
}
