import { codeToTokensBase, createShikiPrimitiveAsync } from '@shikijs/primitive';
import type { ShikiPrimitive } from '@shikijs/primitive';
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import wasm from '@shikijs/engine-oniguruma/wasm-inlined';
import type { EditorThemeId, LanguageId } from '../state/workspace';
import { getBasicTheme } from './basicThemes';
import { textMateTheme } from './syntaxHighlighting';
import type { Highlighter, HighlightSpan, SyntaxStyle } from './syntaxHighlighting';

const grammars = {
  java: () => import('@shikijs/langs/java'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  python: () => import('@shikijs/langs/python'),
  sql: () => import('@shikijs/langs/sql'),
  json: () => import('@shikijs/langs/json'),
  yaml: () => import('@shikijs/langs/yaml'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  xml: () => import('@shikijs/langs/xml'),
  shell: () => import('@shikijs/langs/shellscript'),
  markdown: () => import('@shikijs/langs/markdown'),
} satisfies Record<Exclude<LanguageId, 'plaintext'>, () => Promise<unknown>>;

const font = { italic: 1, bold: 2, strikethrough: 8 } as const; // TextMate font-style bit flags.
const loads = new Map<keyof typeof grammars, Promise<Highlighter>>();
let engine: Promise<ShikiPrimitive> | undefined;
let latest: { code: string; id: LanguageId; theme: EditorThemeId; spans: readonly HighlightSpan[] } | undefined;

export function loadTextMate(id: keyof typeof grammars): Promise<Highlighter> {
  const cached = loads.get(id);
  if (cached) return cached;

  engine ??= createShikiPrimitiveAsync({
    engine: createOnigurumaEngine(wasm), langs: [], themes: [textMateTheme('dark'), textMateTheme('light')],
  }).catch((error: unknown) => {
    engine = undefined;
    throw error;
  });

  const request = Promise.all([engine, grammars[id]()]).then(async ([shiki, grammar]) => {
    await shiki.loadLanguage(grammar);
    return (code: string, theme: EditorThemeId) => {
      if (latest?.code === code && latest.id === id && latest.theme === theme) return latest.spans;
      const lang = id === 'shell' ? 'shellscript' : id;
      const foreground = getBasicTheme(theme).foreground;
      const spans: HighlightSpan[] = [];
      const tokens = codeToTokensBase(shiki, code, { lang, theme, tokenizeMaxLineLength: 10000 });
      for (const line of tokens) {
        for (const { content, offset, color, fontStyle } of line) {
          const flags = Math.max(0, fontStyle ?? 0);
          const fill = color?.toLowerCase();
          const style: SyntaxStyle = {
            ...(fill && fill !== foreground && { color: fill }),
            ...(flags & font.italic ? { fontStyle: 'italic' } : {}),
            ...(flags & font.bold ? { fontWeight: 'bold' } : {}),
            ...(flags & font.strikethrough ? { textDecoration: 'line-through' } : {}),
          };
          if (Object.keys(style).length) spans.push({ from: offset, to: offset + content.length, style });
        }
      }
      latest = { code, id, theme, spans };
      return spans;
    };
  }).catch((error: unknown) => {
    loads.delete(id);
    throw error;
  });
  loads.set(id, request);
  return request;
}
