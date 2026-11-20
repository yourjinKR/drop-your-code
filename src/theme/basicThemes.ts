import type { EditorThemeId } from '../state/workspace';

/** Theme metadata and colors shared by the editor and snapshot renderer. */
export type BasicThemeTokens = {
  readonly label: string;
  readonly appearance: 'dark' | 'light';
  readonly background: string;
  readonly foreground: string;
  readonly header: string;
  readonly border: string;
  readonly muted: string;
  readonly selection: string;
  readonly focus: string;
  readonly syntax: Readonly<Record<
    'keyword' | 'string' | 'comment' | 'literal' | 'type' | 'className' | 'function' | 'property' | 'annotation' | 'escape', string
  > & { controlFlow?: string; variable?: string }>;
};

const themes: Record<EditorThemeId, BasicThemeTokens> = {
  dark: {
    label: 'IntelliJ Dark', appearance: 'dark',
    background: '#1d1f24', foreground: '#e8eaed', header: '#24272d', border: '#383c45',
    muted: '#a2adbd', selection: '#303d56', focus: '#8ab4f8',
    syntax: {
      keyword: '#cf8e6d', string: '#6aab73', comment: '#8c919a', literal: '#90aee5',
      type: '#bcbec4', className: '#abcae7', function: '#56a8f5', property: '#c77dbb',
      annotation: '#b3ae60', escape: '#cf8e6d',
    },
  },
  light: {
    label: 'IntelliJ Light', appearance: 'light',
    background: '#ffffff', foreground: '#222832', header: '#eef0f4', border: '#c9cfd9',
    muted: '#576373', selection: '#d7e6ff', focus: '#245ac2',
    syntax: {
      keyword: '#0033b3', string: '#067d17', comment: '#576373', literal: '#1750eb',
      type: '#41516b', className: '#204c70', function: '#00627a', property: '#871094',
      annotation: '#766500', escape: '#0033b3',
    },
  },
  'vscode-dark': {
    label: 'VS Code Dark+', appearance: 'dark',
    background: '#1e1e1e', foreground: '#d4d4d4', header: '#252526', border: '#3c3c3c',
    muted: '#a6a6a6', selection: '#264f78', focus: '#007acc',
    syntax: {
      keyword: '#569cd6', string: '#ce9178', comment: '#6a9955', literal: '#b5cea8',
      type: '#4ec9b0', className: '#4ec9b0', function: '#dcdcaa', property: '#9cdcfe',
      annotation: '#4ec9b0', escape: '#d7ba7d', controlFlow: '#c586c0', variable: '#9cdcfe',
    },
  },
  'vscode-light': {
    label: 'VS Code Light+', appearance: 'light',
    background: '#ffffff', foreground: '#000000', header: '#e8e8e8', border: '#d4d4d4',
    muted: '#616161', selection: '#add6ff', focus: '#005fb8',
    syntax: {
      keyword: '#0000ff', string: '#a31515', comment: '#008000', literal: '#098658',
      type: '#267f99', className: '#267f99', function: '#795e26', property: '#0451a5',
      annotation: '#267f99', escape: '#ee0000', controlFlow: '#af00db', variable: '#001080',
    },
  },
};

export const editorThemeIds = Object.keys(themes) as readonly EditorThemeId[];

export function getBasicTheme(id: EditorThemeId): BasicThemeTokens {
  return themes[id];
}
