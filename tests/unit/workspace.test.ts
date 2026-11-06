// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  createInitialWorkspace,
  selectSnapshotInput,
  workspaceReducer,
} from '../../src/state/workspace';
import type {
  EditorSettings,
  SnapshotInput,
  WorkspaceAction,
  WorkspaceState,
} from '../../src/state/workspace';

function freezeWorkspace(state: WorkspaceState): WorkspaceState {
  Object.freeze(state.document);
  Object.freeze(state.settings.language);
  Object.freeze(state.settings);
  return Object.freeze(state);
}

const settingChanges: {
  name: string;
  action: WorkspaceAction;
  expected: Partial<EditorSettings>;
}[] = [
  { name: 'keymap', action: { type: 'keymapChanged', preset: 'intellij' }, expected: { keymap: 'intellij' } },
  {
    name: 'language',
    action: { type: 'languageChanged', languageId: 'java' },
    expected: { language: { mode: 'manual', languageId: 'java' } },
  },
  { name: 'syntax theme', action: { type: 'themeChanged', themeId: 'light' }, expected: { themeId: 'light' } },
  { name: 'line numbers', action: { type: 'lineNumbersChanged', enabled: true }, expected: { lineNumbers: true } },
  { name: 'wrap', action: { type: 'wrapChanged', enabled: true }, expected: { wrap: true } },
];

const sourceSamples = [
  { name: 'empty document', code: '' },
  { name: '300 lines and final newline', code: Array.from({ length: 300 }, (_, i) => `line ${i + 1}`).join('\n') + '\n' },
  { name: 'long unwrapped line', code: 'x'.repeat(20_000) },
  { name: 'CRLF and final blank line', code: 'first\r\nsecond\r\n\r\n' },
  { name: 'tabs, spaces and Unicode', code: '\t  const 한글 = "😀";  \n' },
  { name: 'HTML and script as text', code: '<script>alert("literal & text")</script>\nhttps://example.com/code\n' },
];

describe('workspace state', () => {
  it('creates independent workspaces with the planned defaults', () => {
    const first = createInitialWorkspace();
    const second = createInitialWorkspace();

    expect(first).toEqual({
      document: { code: '', revision: 0 },
      settings: {
        keymap: 'vscode',
        language: { mode: 'manual', languageId: 'plaintext' },
        themeId: 'dark',
        lineNumbers: false,
        wrap: false,
      },
    });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.document).not.toBe(first.document);
    expect(second.settings).not.toBe(first.settings);
    expect(second.settings.language).not.toBe(first.settings.language);
  });

  it('code_change_increments_revision', () => {
    const initial = freezeWorkspace(createInitialWorkspace());
    const changed = workspaceReducer(initial, { type: 'codeChanged', code: 'const x = 1;\n' });
    const cleared = workspaceReducer(freezeWorkspace(changed), { type: 'codeChanged', code: '' });

    expect(changed.document).toEqual({ code: 'const x = 1;\n', revision: 1 });
    expect(cleared.document).toEqual({ code: '', revision: 2 });
    expect(initial.document).toEqual({ code: '', revision: 0 });
    expect(changed.document).toEqual({ code: 'const x = 1;\n', revision: 1 });
    expect(changed.settings).toEqual(initial.settings);
  });

  it('code replacement increments revision without resetting settings', () => {
    const configured = workspaceReducer(createInitialWorkspace(), { type: 'keymapChanged', preset: 'intellij' });
    const state = freezeWorkspace(workspaceReducer(configured, { type: 'codeChanged', code: 'current' }));
    const replaced = workspaceReducer(state, { type: 'codeReplaced', code: 'restored\n' });

    expect(replaced.document).toEqual({ code: 'restored\n', revision: 2 });
    expect(replaced.settings).toEqual(state.settings);
    expect(state.document).toEqual({ code: 'current', revision: 1 });
  });

  it.each(['codeChanged', 'codeReplaced'] as const)('same_code_is_noop (%s)', (type) => {
    const empty = freezeWorkspace(createInitialWorkspace());
    expect(workspaceReducer(empty, { type, code: '' })).toBe(empty);

    const state = freezeWorkspace(workspaceReducer(empty, { type: 'codeChanged', code: 'same\n' }));
    expect(workspaceReducer(state, { type, code: 'same\n' })).toBe(state);
    expect(state.document.revision).toBe(1);
  });

  it.each(settingChanges)('settings_preserve_code ($name)', ({ action, expected }) => {
    const state = freezeWorkspace(workspaceReducer(createInitialWorkspace(), { type: 'codeChanged', code: 'unchanged\n' }));
    const next = workspaceReducer(state, action);

    expect(next.settings).toEqual({ ...state.settings, ...expected });
    expect(next.document).toEqual({ code: 'unchanged\n', revision: 1 });
    expect(state.settings).toEqual(createInitialWorkspace().settings);
    expect(state.document).toEqual({ code: 'unchanged\n', revision: 1 });
    expect(workspaceReducer(freezeWorkspace(next), action)).toBe(next);
  });

  it.each(sourceSamples)('projection_keeps_full_text_and_final_newline ($name)', ({ code }) => {
    for (const type of ['codeChanged', 'codeReplaced'] as const) {
      const state = workspaceReducer(createInitialWorkspace(), { type, code });
      expect(state.document.code).toBe(code);
      expect(selectSnapshotInput(state).code).toBe(code);
    }
  });

  it('projection_excludes_keymap_and_does_not_mutate_source', () => {
    let state = workspaceReducer(createInitialWorkspace(), { type: 'codeChanged', code: 'class Example {}\n' });
    for (const { action } of settingChanges) state = workspaceReducer(state, action);
    freezeWorkspace(state);

    const snapshot: SnapshotInput = selectSnapshotInput(state);
    expect(snapshot).toEqual({
      code: 'class Example {}\n',
      revision: 1,
      languageId: 'java',
      themeId: 'light',
      lineNumbers: true,
      wrap: true,
    });
    expect(snapshot).not.toBe(state.document);
    expect(Object.values(snapshot).every((value) => value === null || typeof value !== 'object')).toBe(true);
    expect(state.settings.keymap).toBe('intellij');
    expect(state.settings.language).toEqual({ mode: 'manual', languageId: 'java' });
    expect(selectSnapshotInput(state)).not.toBe(snapshot);
  });

  it('previous snapshots remain stable across later document and setting changes', () => {
    const state = workspaceReducer(createInitialWorkspace(), { type: 'codeChanged', code: 'original\n' });
    const snapshot = selectSnapshotInput(state);
    const edited = workspaceReducer(state, { type: 'codeChanged', code: 'later\n' });
    const restyled = workspaceReducer(edited, { type: 'themeChanged', themeId: 'light' });

    expect(snapshot).toEqual({
      code: 'original\n', revision: 1, languageId: 'plaintext', themeId: 'dark', lineNumbers: false, wrap: false,
    });
    expect(selectSnapshotInput(restyled)).toEqual({ ...snapshot, code: 'later\n', revision: 2, themeId: 'light' });
  });

  it('exports readonly state and snapshot contracts', () => {
    const state: WorkspaceState = createInitialWorkspace();
    const snapshot: SnapshotInput = selectSnapshotInput(state);

    // These assignments are checked by tsc, not executed by the runtime test.
    if (false) {
      // @ts-expect-error Document state cannot be changed outside the reducer.
      state.document.code = 'mutated';
      // @ts-expect-error Settings and their nested language selection are readonly.
      state.settings.language.languageId = 'java';
      // @ts-expect-error Syntax settings cannot be changed outside the reducer.
      state.settings.themeId = 'light';
      // @ts-expect-error SnapshotInput is readonly for downstream consumers.
      snapshot.code = 'mutated';
      // @ts-expect-error Snapshot revision is also readonly.
      snapshot.revision = 99;
    }
    expect(snapshot.code).toBe('');
  });
});
