import {
  copyLineDown,
  deleteLine,
  indentLess,
  indentMore,
  moveLineDown,
  moveLineUp,
  redo,
  standardKeymap,
  toggleComment,
  undo,
} from '@codemirror/commands';
import type { Command, KeyBinding } from '@codemirror/view';
import type { KeymapPreset } from '../state/workspace';

export type EditorPlatform = 'windows' | 'macos' | 'other';

export function detectPlatform(): EditorPlatform {
  if (typeof navigator === 'undefined') return 'other';
  if (/Mac/.test(navigator.platform)) return 'macos';
  if (/Win/.test(navigator.platform)) return 'windows';
  return 'other';
}

function insideEditor(command: Command): Command {
  return (view) => {
    if (!view.hasFocus || view.compositionStarted || view.composing) return false;
    return command(view);
  };
}

function guarded(binding: KeyBinding): KeyBinding {
  return {
    ...binding,
    // A false result must leave IME, native inputs, and unhandled keys alone.
    preventDefault: false,
    ...(binding.run ? { run: insideEditor(binding.run) } : {}),
    ...(binding.shift ? { shift: insideEditor(binding.shift) } : {}),
  };
}

/**
 * Windows/other follow PRD FR-EDIT-02; other is a product fallback, not Linux parity.
 * macOS (IntelliJ / VS Code):
 * Undo Cmd+Z / Cmd+Z; Redo Cmd+Shift+Z / Cmd+Shift+Z;
 * Duplicate Cmd+D / Shift+Option+Down; Delete Cmd+Backspace / Cmd+Shift+K;
 * Move Shift+Option+Up/Down / Option+Up/Down; Comment Cmd+/ / Cmd+/;
 * Indent Tab, outdent Shift+Tab, native linewise Cut Cmd+X for both.
 * Sources (checked 2026-11-07):
 * https://www.jetbrains.com/help/idea/reference-keymap-mac-default.html
 * https://code.visualstudio.com/docs/reference/default-keybindings
 * https://raw.githubusercontent.com/microsoft/vscode-docs/main/build/keybindings/doc.keybindings.osx.json
 */
export function buildKeymap(preset: KeymapPreset, platform: EditorPlatform): readonly KeyBinding[] {
  const modifier = platform === 'macos' ? 'Meta' : 'Ctrl';
  const intellij = preset === 'intellij';
  const bindings: KeyBinding[] = [
    { key: `${modifier}-z`, run: undo },
    { key: platform === 'macos' || intellij ? `${modifier}-Shift-z` : 'Ctrl-y', run: redo },
    { key: intellij ? `${modifier}-d` : 'Shift-Alt-ArrowDown', run: copyLineDown },
    {
      key: intellij
        ? platform === 'macos' ? 'Meta-Backspace' : 'Ctrl-y'
        : `${modifier}-Shift-k`,
      run: deleteLine,
    },
    { key: intellij ? 'Shift-Alt-ArrowUp' : 'Alt-ArrowUp', run: moveLineUp },
    { key: intellij ? 'Shift-Alt-ArrowDown' : 'Alt-ArrowDown', run: moveLineDown },
    { key: `${modifier}-/`, run: toggleComment },
    { key: 'Tab', run: indentMore, shift: indentLess },
  ];

  // Preset bindings precede basic navigation. Never append a shared history map:
  // Ctrl+Y must not fall through to Redo in IntelliJ. Escape stays unbound.
  // Ctrl/Cmd+C/X use CodeMirror's native clipboard handlers, including linewise cut.
  return [...bindings, ...standardKeymap].map(guarded);
}
