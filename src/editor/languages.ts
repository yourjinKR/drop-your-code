import { LanguageSupport, StreamLanguage } from '@codemirror/language';
import type { LanguageId } from '../state/workspace';

type LanguageEntry = {
  label: string;
  load: (() => Promise<LanguageSupport>) | null;
};

export const languages = {
  plaintext: { label: 'Plain Text', load: null },
  java: { label: 'Java', load: () => import('@codemirror/lang-java').then(({ java }) => java()) },
  kotlin: {
    label: 'Kotlin',
    load: () => import('@codemirror/legacy-modes/mode/clike')
      .then(({ kotlin }) => new LanguageSupport(StreamLanguage.define(kotlin))),
  },
  javascript: {
    label: 'JavaScript',
    load: () => import('@codemirror/lang-javascript').then(({ javascript }) => javascript()),
  },
  typescript: {
    label: 'TypeScript',
    load: () => import('@codemirror/lang-javascript')
      .then(({ javascript }) => javascript({ typescript: true })),
  },
  python: { label: 'Python', load: () => import('@codemirror/lang-python').then(({ python }) => python()) },
  sql: { label: 'SQL', load: () => import('@codemirror/lang-sql').then(({ sql }) => sql()) },
  json: { label: 'JSON', load: () => import('@codemirror/lang-json').then(({ json }) => json()) },
  yaml: { label: 'YAML', load: () => import('@codemirror/lang-yaml').then(({ yaml }) => yaml()) },
  html: { label: 'HTML', load: () => import('@codemirror/lang-html').then(({ html }) => html()) },
  css: { label: 'CSS', load: () => import('@codemirror/lang-css').then(({ css }) => css()) },
  xml: { label: 'XML', load: () => import('@codemirror/lang-xml').then(({ xml }) => xml()) },
  shell: {
    label: 'Shell',
    load: () => import('@codemirror/legacy-modes/mode/shell')
      .then(({ shell }) => new LanguageSupport(StreamLanguage.define(shell))),
  },
  markdown: {
    label: 'Markdown',
    load: () => import('@codemirror/lang-markdown').then(({ markdown }) => markdown({ addKeymap: false })),
  },
} satisfies Record<LanguageId, LanguageEntry>;

export const languageIds = Object.keys(languages) as LanguageId[];

export function isLanguageId(value: string): value is LanguageId {
  return Object.hasOwn(languages, value);
}

const languageLoads = new Map<LanguageId, Promise<LanguageSupport>>();

export function loadLanguage(id: LanguageId): Promise<LanguageSupport | null> {
  const load = languages[id].load;
  if (!load) return Promise.resolve(null);
  const cached = languageLoads.get(id);
  if (cached) return cached;
  // Avoid poisoning the browser's module map when it already reports being offline.
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return Promise.reject(new Error('Offline'));
  }

  const request = load().catch((error: unknown) => {
    languageLoads.delete(id);
    throw error;
  });
  languageLoads.set(id, request);
  return request;
}
