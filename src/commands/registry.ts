import { keymapLabels, keymapPresets } from '../editor/keymaps';
import { languageIds, languages } from '../editor/languages';
import type { SnapshotExportOptions } from '../export/encodeSnapshot';
import type { EditorSettings, LanguageId, WorkspaceAction } from '../state/workspace';
import { editorThemeIds, getBasicTheme } from '../theme/basicThemes';

export type PaletteMode = 'all' | 'languages' | 'themes' | 'keymaps';
type ChooserMode = Exclude<PaletteMode, 'all'>;
export type CommandCategory = 'Languages' | 'Appearance' | 'Editor' | 'Workspace' | 'Export';
type Format = SnapshotExportOptions['format'];

export type PaletteCommand = {
  id: string;
  title: string;
  category: CommandCategory;
  keywords: readonly string[];
  current?: boolean;
  enabled?: boolean;
} & ({ opens: ChooserMode; execute?: never } | { opens?: never; execute: () => void });

type CommandActions = {
  settings: EditorSettings;
  dispatch: (action: WorkspaceAction) => void;
  chooseLanguage: (id: LanguageId) => void;
  focusEditor: () => void;
  toggleProperties: () => void;
  resetCanvas: () => void;
  copyImage: () => void;
  exportImage: (format: Format) => void;
  exportBusy: boolean;
};

const formats = { png: 'PNG', svg: 'SVG', jpg: 'JPG', webp: 'WebP' } satisfies Record<Format, string>;

const extraLanguageKeywords: Partial<Record<LanguageId, readonly string[]>> = {
  plaintext: ['text', 'txt'],
  shell: ['bash', 'zsh'],
  yaml: ['yml'],
};

export function getCommands(mode: PaletteMode, actions: CommandActions): PaletteCommand[] {
  const { settings, dispatch, chooseLanguage, focusEditor, toggleProperties, resetCanvas, copyImage, exportImage,
    exportBusy } = actions;

  if (mode === 'themes') {
    return editorThemeIds.map((id) => ({
      id, title: getBasicTheme(id).label, category: 'Appearance', keywords: ['syntax', 'theme', id],
      current: id === settings.themeId,
      execute: () => dispatch({ type: 'themeChanged', themeId: id }),
    }));
  }
  if (mode === 'keymaps') {
    return keymapPresets.map((preset) => ({
      id: preset, title: keymapLabels[preset], category: 'Editor', keywords: ['keymap', 'keyboard', preset],
      current: preset === settings.keymap,
      execute: () => dispatch({ type: 'keymapChanged', preset }),
    }));
  }

  const languageCommands: PaletteCommand[] = languageIds.map((id) => {
    const { label, extension } = languages[id];
    return {
      id: `language-${id}`,
      title: mode === 'all' ? `Set Language: ${label}` : label,
      category: 'Languages',
      keywords: [id, ...(extension ? [extension] : []), ...(extraLanguageKeywords[id] ?? [])],
      current: id === settings.language.languageId,
      execute: () => chooseLanguage(id),
    };
  });
  if (mode === 'languages') return languageCommands;

  const { presentation } = settings;
  function togglePresentation(key: 'showTitle' | 'shadowEnabled' | 'transparent') {
    dispatch({ type: 'presentationChanged', presentation: { ...presentation, [key]: !presentation[key] } });
  }

  return [
    { id: 'change-language', title: 'Change Language', category: 'Languages',
      keywords: ['syntax', 'parser', 'choose'], opens: 'languages' },
    { id: 'change-theme', title: 'Change Syntax Theme', category: 'Appearance',
      keywords: ['color', 'highlighting'], opens: 'themes' },
    { id: 'line-numbers', title: 'Toggle Line Numbers', category: 'Appearance',
      keywords: ['gutter', 'numbering'],
      execute: () => dispatch({ type: 'lineNumbersChanged', enabled: !settings.lineNumbers }) },
    { id: 'word-wrap', title: 'Toggle Word Wrap', category: 'Appearance', keywords: ['wrap lines', 'wrapping'],
      execute: () => dispatch({ type: 'wrapChanged', enabled: !settings.wrap }) },
    { id: 'window-title', title: 'Toggle Window Title', category: 'Appearance', keywords: ['filename', 'header'],
      execute: () => togglePresentation('showTitle') },
    { id: 'window-shadow', title: 'Toggle Window Shadow', category: 'Appearance', keywords: ['drop shadow'],
      execute: () => togglePresentation('shadowEnabled') },
    { id: 'transparency', title: 'Toggle Transparent Background', category: 'Appearance', keywords: ['alpha', 'opacity'],
      execute: () => togglePresentation('transparent') },
    { id: 'focus-editor', title: 'Focus Editor', category: 'Editor', keywords: ['code', 'cursor'], execute: focusEditor },
    { id: 'change-keymap', title: 'Change Keymap', category: 'Editor',
      keywords: ['preset', 'shortcuts', 'VS Code', 'IntelliJ'], opens: 'keymaps' },
    { id: 'toggle-properties', title: 'Toggle Properties', category: 'Workspace',
      keywords: ['settings', 'panel', 'sidebar'], execute: toggleProperties },
    { id: 'reset-canvas', title: 'Reset Canvas View', category: 'Workspace',
      keywords: ['zoom', 'pan', 'center'], execute: resetCanvas },
    { id: 'copy-image', title: 'Copy Image', category: 'Export', keywords: ['clipboard', 'PNG'],
      enabled: !exportBusy, execute: copyImage },
    ...(Object.keys(formats) as Format[]).map((format): PaletteCommand => ({
      id: `export-${format}`, title: `Export as ${formats[format]}`, category: 'Export',
      keywords: ['download', 'save', ...(format === 'jpg' ? ['jpeg'] : [])],
      enabled: !exportBusy, execute: () => exportImage(format),
    })),
    ...languageCommands,
  ];
}

export function runCommand(command: PaletteCommand, open: (mode: PaletteMode) => void, close: () => void) {
  if (command.enabled === false) return;
  if (command.opens) {
    open(command.opens);
  } else {
    close();
    command.execute();
  }
}

export function filterCommands(commands: readonly PaletteCommand[], query: string): readonly PaletteCommand[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return commands;
  const terms = normalized.split(/\s+/);
  const matches: { command: PaletteCommand; rank: number }[] = [];

  for (const command of commands) {
    const title = command.title.toLowerCase();
    if (title === normalized) {
      matches.push({ command, rank: 0 });
      continue;
    }
    const words = title.split(/\W+/);
    const keywords = command.keywords.map((keyword) => keyword.toLowerCase());
    let rank = 1;
    for (const term of terms) {
      if (words.includes(term)) rank += 1;
      else if (keywords.includes(term)) rank += 2;
      else if (words.some((word) => word.startsWith(term))) rank += 3;
      else if (title.includes(term)) rank += 4;
      else if (keywords.some((keyword) => keyword.includes(term))) rank += 5;
      else {
        rank = Infinity;
        break;
      }
    }
    if (Number.isFinite(rank)) matches.push({ command, rank });
  }
  return matches.sort((first, second) => first.rank - second.rank).map(({ command }) => command);
}
