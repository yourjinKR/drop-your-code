import { useCallback, useReducer, useState } from 'react';
import type { LanguageSupport } from '@codemirror/language';
import { EditorSurface } from '../editor/EditorSurface';
import { LanguageSelect } from '../editor/LanguageSelect';
import { detectPlatform } from '../editor/keymaps';
import { languages } from '../editor/languages';
import { createInitialWorkspace, workspaceReducer } from '../state/workspace';
import type { LanguageId } from '../state/workspace';

export function App() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, createInitialWorkspace);
  const [languageSupport, setLanguageSupport] = useState<LanguageSupport | null>(null);
  const languageId = workspace.settings.language.languageId;
  const onLanguageApplied = useCallback((id: LanguageId, support: LanguageSupport | null) => {
    setLanguageSupport(support);
    dispatch({ type: 'languageChanged', languageId: id });
  }, []);
  const onCodeChange = useCallback((code: string) => {
    dispatch({ type: 'codeChanged', code });
  }, [dispatch]);
  const lineCount = workspace.document.code.split('\n').length;
  const isMac = detectPlatform() === 'macos';
  const keymapHint = isMac
    ? workspace.settings.keymap === 'intellij'
      ? 'In the editor, Cmd+Backspace deletes a line. Cmd+Shift+Z is Redo.'
      : 'In the editor, Cmd+Shift+K deletes a line. Cmd+Shift+Z is Redo.'
    : workspace.settings.keymap === 'intellij'
      ? 'In the editor, Ctrl+Y deletes a line. Ctrl+Shift+Z is Redo.'
      : 'In the editor, Ctrl+Y is Redo.';

  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to editor
      </a>

      <header className="app-header" aria-label="Drop Your Code">
        <div className="header-content">
          <h1>Drop Your Code</h1>
        </div>
      </header>

      <main
        className="workspace"
        id="workspace"
        aria-labelledby="editor-heading"
        tabIndex={-1}
      >
        <div className="workspace-layout">
          <div className="workspace-editor">
            <section className="editor-panel" aria-labelledby="editor-heading">
              <div className="panel-header">
                <h2 id="editor-heading">Editor</h2>
                <div className="keymap-control">
                  <label htmlFor="keymap">Keymap</label>
                  <select
                    id="keymap"
                    name="keymap"
                    value={workspace.settings.keymap}
                    aria-describedby="keymap-help"
                    onChange={(event) => {
                      const preset = event.currentTarget.value;
                      if (preset === 'vscode' || preset === 'intellij') {
                        dispatch({ type: 'keymapChanged', preset });
                      }
                    }}
                  >
                    <option value="vscode">VS Code</option>
                    <option value="intellij">IntelliJ</option>
                  </select>
                </div>
              </div>
              <EditorSurface
                code={workspace.document.code}
                settings={workspace.settings}
                languageSupport={languageSupport}
                onCodeChange={onCodeChange}
              />
            </section>
            <p className="editor-help" id="editor-help">
              Tab indents. Press Escape, then Tab to leave the editor.
            </p>
            <p className="keymap-help" id="keymap-help">
              {keymapHint} Browser and system shortcuts may take priority.
            </p>
          </div>
          <aside className="properties-panel" aria-labelledby="properties-heading">
            <h2 id="properties-heading">Properties</h2>
            <h3>Code</h3>
            <LanguageSelect appliedId={languageId} onApplied={onLanguageApplied} />
          </aside>
        </div>
      </main>

      <footer className="app-footer" role="status" aria-label="Editor status" aria-live="off">
        <span>{languages[languageId].label}</span>
        <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
      </footer>
    </>
  );
}
