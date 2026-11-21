import { describe, expect, it, vi } from 'vitest';
import { filterCommands, getCommands, runCommand } from '../../src/commands/registry';
import type { PaletteMode } from '../../src/commands/registry';
import { languageIds, languages } from '../../src/editor/languages';
import { createInitialWorkspace } from '../../src/state/workspace';

function commandActions(exportBusy = false) {
  return {
    settings: createInitialWorkspace().settings,
    dispatch: vi.fn(),
    chooseLanguage: vi.fn(),
    focusEditor: vi.fn(),
    toggleProperties: vi.fn(),
    resetCanvas: vi.fn(),
    copyImage: vi.fn(),
    exportImage: vi.fn(),
    exportBusy,
  };
}

describe('command palette registry', () => {
  it('lists each supported language in both modes and marks the applied language', () => {
    const actions = commandActions();
    const choices = getCommands('languages', actions);
    const direct = getCommands('all', actions).filter((command) => command.id.startsWith('language-'));

    expect(choices.map(({ title }) => title)).toEqual(languageIds.map((id) => languages[id].label));
    expect(direct.map(({ title }) => title)).toEqual(choices.map(({ title }) => `Set Language: ${title}`));
    expect(choices.filter(({ current }) => current).map(({ id }) => id)).toEqual(['language-plaintext']);
  });

  it('ranks exact words, aliases, and multi-word matches without capping results', () => {
    const actions = commandActions();
    const languages = getCommands('languages', actions);
    const commands = getCommands('all', actions);
    expect(filterCommands(languages, '  PY  ')[0]?.title).toBe('Python');
    expect(filterCommands(commands, '  PY  ')[0]?.title).toBe('Set Language: Python');
    expect(filterCommands(languages, 'java').map(({ title }) => title)).toEqual(['Java', 'JavaScript']);
    expect(filterCommands(languages, 'Bash')[0]?.title).toBe('Shell');
    expect(filterCommands(commands, 'set lang TS')[0]?.title).toBe('Set Language: TypeScript');
    expect(filterCommands(commands, 'numbers line')[0]?.title).toBe('Toggle Line Numbers');
    expect(filterCommands(commands, 'png')[0]?.title).toBe('Export as PNG');
    expect(filterCommands(commands, 'missing command')).toEqual([]);
    expect(filterCommands(commands, '')).toHaveLength(commands.length);
  });

  it('opens choosers in place and closes before executing workspace actions', () => {
    const actions = commandActions();
    const open = vi.fn<(mode: PaletteMode) => void>();
    const close = vi.fn();
    function run(mode: PaletteMode, title: string) {
      const command = getCommands(mode, actions).find((item) => item.title === title);
      if (!command) throw new Error(`Unknown command: ${title}`);
      runCommand(command, open, close);
    }

    run('all', 'Change Language');
    run('all', 'Change Syntax Theme');
    run('all', 'Change Keymap');
    expect(open.mock.calls).toEqual([['languages'], ['themes'], ['keymaps']]);
    expect(close).not.toHaveBeenCalled();

    run('languages', 'Python');
    run('all', 'Toggle Line Numbers');
    run('all', 'Toggle Window Shadow');
    run('all', 'Focus Editor');
    run('keymaps', 'IntelliJ');
    expect(actions.chooseLanguage).toHaveBeenCalledWith('python');
    expect(actions.dispatch).toHaveBeenCalledWith({ type: 'lineNumbersChanged', enabled: true });
    expect(actions.dispatch).toHaveBeenCalledWith({
      type: 'presentationChanged',
      presentation: { ...actions.settings.presentation, shadowEnabled: true },
    });
    expect(actions.dispatch).toHaveBeenCalledWith({ type: 'keymapChanged', preset: 'intellij' });
    expect(close.mock.invocationCallOrder[3]).toBeLessThan(actions.focusEditor.mock.invocationCallOrder[0]!);
  });

  it('runs each format explicitly and keeps busy commands disabled', () => {
    const actions = commandActions();
    const busyActions = commandActions(true);
    const open = vi.fn();
    const close = vi.fn();
    const exportCommands = getCommands('all', actions).filter(({ category }) => category === 'Export');
    const disabled = getCommands('all', busyActions).filter(({ category }) => category === 'Export');

    for (const command of disabled) runCommand(command, open, close);
    expect(disabled.every(({ enabled }) => enabled === false)).toBe(true);
    expect(close).not.toHaveBeenCalled();
    expect(busyActions.copyImage).not.toHaveBeenCalled();
    expect(busyActions.exportImage).not.toHaveBeenCalled();

    for (const command of exportCommands) runCommand(command, open, close);
    expect(actions.copyImage).toHaveBeenCalledOnce();
    expect(actions.exportImage.mock.calls).toEqual([['png'], ['svg'], ['jpg'], ['webp']]);
    expect(close).toHaveBeenCalledTimes(5);
  });
});
