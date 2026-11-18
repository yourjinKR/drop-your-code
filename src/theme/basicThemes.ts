import type { EditorThemeId } from '../state/workspace';

/** Plain color data shared by the editor and snapshot renderer. */
export type BasicThemeTokens = {
  readonly background: string;
  readonly foreground: string;
  readonly header: string;
  readonly border: string;
  readonly muted: string;
  readonly selection: string;
  readonly focus: string;
  readonly syntax: Readonly<Record<
    'keyword' | 'string' | 'comment' | 'literal' | 'type' | 'className' | 'function' | 'property' | 'annotation' | 'escape', string
  >>;
};

const themes: Record<EditorThemeId, BasicThemeTokens> = {
  dark: {
    background: '#1d1f24', foreground: '#e8eaed', header: '#24272d', border: '#383c45',
    muted: '#a2adbd', selection: '#303d56', focus: '#8ab4f8',
    syntax: {
      keyword: '#cf8e6d', string: '#6aab73', comment: '#8c919a', literal: '#90aee5',
      type: '#bcbec4', className: '#abcae7', function: '#56a8f5', property: '#c77dbb',
      annotation: '#b3ae60', escape: '#cf8e6d',
    },
  },
  light: {
    background: '#ffffff', foreground: '#222832', header: '#eef0f4', border: '#c9cfd9',
    muted: '#576373', selection: '#d7e6ff', focus: '#245ac2',
    syntax: {
      keyword: '#0033b3', string: '#067d17', comment: '#576373', literal: '#1750eb',
      type: '#41516b', className: '#204c70', function: '#00627a', property: '#871094',
      annotation: '#766500', escape: '#0033b3',
    },
  },
};

export function getBasicTheme(id: EditorThemeId): BasicThemeTokens {
  return themes[id];
}
