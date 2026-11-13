import { defaultSnapshotPresentation, validPresentation } from '../snapshot/presentation';
import type { SnapshotPresentation } from '../snapshot/presentation';

export type KeymapPreset = 'intellij' | 'vscode';

/** Syntax theme only; the application UI theme is a separate preference. */
export type EditorThemeId = 'dark' | 'light';

export type LanguageId =
  | 'plaintext'
  | 'java'
  | 'kotlin'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'json'
  | 'yaml'
  | 'html'
  | 'css'
  | 'xml'
  | 'shell'
  | 'markdown';

export type EditorSettings = {
  readonly keymap: KeymapPreset;
  readonly language: {
    readonly mode: 'manual';
    readonly languageId: LanguageId;
  };
  readonly themeId: EditorThemeId;
  readonly lineNumbers: boolean;
  readonly wrap: boolean;
  readonly presentation: SnapshotPresentation;
};

export type WorkspaceState = {
  readonly document: {
    readonly code: string;
    readonly revision: number;
  };
  readonly settings: EditorSettings;
};

export type WorkspaceAction =
  | { type: 'codeChanged' | 'codeReplaced'; code: string }
  | { type: 'keymapChanged'; preset: KeymapPreset }
  | { type: 'languageChanged'; languageId: LanguageId }
  | { type: 'themeChanged'; themeId: EditorThemeId }
  | { type: 'presentationChanged'; presentation: SnapshotPresentation }
  | { type: 'lineNumbersChanged' | 'wrapChanged'; enabled: boolean };

/** Whole-document values for downstream rendering, without editor or UI state. */
export type SnapshotInput = {
  readonly code: string;
  readonly revision: number;
  readonly languageId: LanguageId;
  readonly themeId: EditorThemeId;
  readonly lineNumbers: boolean;
  readonly wrap: boolean;
  readonly presentation: SnapshotPresentation;
};

export function createInitialWorkspace(): WorkspaceState {
  return {
    document: { code: '', revision: 0 },
    settings: {
      keymap: 'vscode',
      language: { mode: 'manual', languageId: 'plaintext' },
      themeId: 'dark',
      lineNumbers: false,
      wrap: false,
      presentation: defaultSnapshotPresentation,
    },
  };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'codeChanged':
    case 'codeReplaced':
      if (state.document.code === action.code) return state;
      return {
        ...state,
        document: { code: action.code, revision: state.document.revision + 1 },
      };
    case 'keymapChanged':
      if (state.settings.keymap === action.preset) return state;
      return { ...state, settings: { ...state.settings, keymap: action.preset } };
    case 'languageChanged':
      if (state.settings.language.languageId === action.languageId) return state;
      return {
        ...state,
        settings: {
          ...state.settings,
          language: { mode: 'manual', languageId: action.languageId },
        },
      };
    case 'themeChanged':
      if (state.settings.themeId === action.themeId) return state;
      return { ...state, settings: { ...state.settings, themeId: action.themeId } };
    case 'presentationChanged': {
      const current = state.settings.presentation;
      if (!validPresentation(action.presentation)) return state;
      const presentation = { ...action.presentation, backgroundColor: action.presentation.backgroundColor.toLowerCase() };
      const keys = Object.keys(defaultSnapshotPresentation) as (keyof SnapshotPresentation)[];
      if (keys.every((key) => current[key] === presentation[key])) return state;
      return { ...state, settings: { ...state.settings, presentation: Object.freeze(presentation) } };
    }
    case 'lineNumbersChanged':
      if (state.settings.lineNumbers === action.enabled) return state;
      return { ...state, settings: { ...state.settings, lineNumbers: action.enabled } };
    case 'wrapChanged':
      if (state.settings.wrap === action.enabled) return state;
      return { ...state, settings: { ...state.settings, wrap: action.enabled } };
  }
}

export function selectSnapshotInput(state: WorkspaceState): SnapshotInput {
  return {
    code: state.document.code,
    revision: state.document.revision,
    languageId: state.settings.language.languageId,
    themeId: state.settings.themeId,
    lineNumbers: state.settings.lineNumbers,
    wrap: state.settings.wrap,
    presentation: state.settings.presentation,
  };
}
