import type { EditorThemeId } from '../state/workspace';

/** Plain color data shared by the editor and future snapshot renderer. */
export type BasicThemeTokens = {
  readonly background: string;
  readonly foreground: string;
  readonly header: string;
  readonly border: string;
  readonly muted: string;
  readonly selection: string;
  readonly focus: string;
  readonly syntax: Readonly<Record<'keyword' | 'string' | 'comment' | 'literal' | 'type' | 'property' | 'escape', string>>;
};

const themes: Record<EditorThemeId, BasicThemeTokens> = {
  dark: {
    background: '#1d1f24', foreground: '#e8eaed', header: '#24272d', border: '#383c45',
    muted: '#a2adbd', selection: '#303d56', focus: '#8ab4f8',
    syntax: {
      keyword: '#d7a9f0', string: '#acd69e', comment: '#a2adbd', literal: '#f3bc92',
      type: '#99c7ff', property: '#91dfd4', escape: '#f4cb7c',
    },
  },
  light: {
    background: '#ffffff', foreground: '#222832', header: '#eef0f4', border: '#c9cfd9',
    muted: '#576373', selection: '#d7e6ff', focus: '#245ac2',
    syntax: {
      keyword: '#742894', string: '#235c33', comment: '#576373', literal: '#884219',
      type: '#144e91', property: '#006051', escape: '#745309',
    },
  },
};

export function getBasicTheme(id: EditorThemeId): BasicThemeTokens {
  return themes[id];
}
