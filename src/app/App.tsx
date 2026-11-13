import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CodeXml, Moon, PanelRightOpen, SquareCode, Sun } from 'lucide-react';
import type { LanguageSupport } from '@codemirror/language';
import { CodeWindow } from '../components/CodeWindow';
import { EditorSettings } from '../components/EditorSettings';
import { IconButton } from '../components/ui/IconButton';
import { EditorSurface } from '../editor/EditorSurface';
import { detectPlatform } from '../editor/keymaps';
import { languages } from '../editor/languages';
import { useSnapshotModel } from '../snapshot/useSnapshotModel';
import { createInitialWorkspace, selectSnapshotInput, workspaceReducer } from '../state/workspace';
import type { LanguageId } from '../state/workspace';

type UiTheme = 'dark' | 'light';

export function App() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, createInitialWorkspace);
  const [languageSupport, setLanguageSupport] = useState<LanguageSupport | null>(null);
  const [uiTheme, setUiTheme] = useState<UiTheme>('dark');
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const editorFocus = useRef<(() => void) | null>(null);
  const showProperties = useRef<HTMLButtonElement>(null);
  const collapseProperties = useRef<HTMLButtonElement>(null);
  const movePanelFocus = useRef(false);

  const { settings } = workspace;
  const languageId = settings.language.languageId;
  const { themeId, lineNumbers, wrap } = settings;
  const input = useMemo(() => selectSnapshotInput(workspace), [workspace.document, languageId, themeId, lineNumbers, wrap]);
  const { model } = useSnapshotModel(input);
  const lineCount = workspace.document.code.split('\n').length;
  const isMac = detectPlatform() === 'macos';
  const keymapHint = isMac
    ? settings.keymap === 'intellij'
      ? 'In the editor, Cmd+Backspace deletes a line. Cmd+Shift+Z is Redo.'
      : 'In the editor, Cmd+Shift+K deletes a line. Cmd+Shift+Z is Redo.'
    : settings.keymap === 'intellij'
      ? 'In the editor, Ctrl+Y deletes a line. Ctrl+Shift+Z is Redo.'
      : 'In the editor, Ctrl+Y is Redo.';

  const onLanguageApplied = useCallback((id: LanguageId, support: LanguageSupport | null) => {
    setLanguageSupport(support);
    dispatch({ type: 'languageChanged', languageId: id });
  }, []);
  const onCodeChange = useCallback((code: string) => dispatch({ type: 'codeChanged', code }), []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset['uiTheme'] = uiTheme;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--ui-canvas').trim();
    return () => {
      delete root.dataset['uiTheme'];
      if (meta) meta.content = '#14161a';
    };
  }, [uiTheme]);

  useLayoutEffect(() => {
    if (!movePanelFocus.current) return;
    movePanelFocus.current = false;
    (propertiesOpen ? collapseProperties : showProperties).current?.focus();
  }, [propertiesOpen]);

  function toggleProperties() {
    movePanelFocus.current = true;
    setPropertiesOpen((open) => !open);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Skip to editor</a>

      <header className="app-header">
        <span className="brand-mark"><CodeXml size={20} aria-hidden="true" /></span>
        <h1 translate="no">Drop Your Code</h1>
      </header>

      <div className="activity-bar" role="group" aria-label="Workspace controls">
        <IconButton label="Focus editor" onClick={() => editorFocus.current?.()}>
          <SquareCode size={18} aria-hidden="true" />
        </IconButton>
        <IconButton
          label={uiTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setUiTheme((theme) => theme === 'dark' ? 'light' : 'dark')}
        >
          {uiTheme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </IconButton>
      </div>

      <main
        className="workspace"
        id="workspace"
        aria-labelledby="editor-heading"
        tabIndex={-1}
        data-properties-open={propertiesOpen}
      >
        <section className="workspace-editor" aria-labelledby="editor-heading">
          <div className="workspace-header">
            <h2 id="editor-heading"><SquareCode size={16} aria-hidden="true" />Editor</h2>
            <div className="workspace-controls">
              <div className="keymap-control">
                <label htmlFor="keymap">Keymap</label>
                <select
                  id="keymap"
                  name="keymap"
                  value={settings.keymap}
                  aria-describedby="keymap-help"
                  onChange={(event) => {
                    const preset = event.currentTarget.value;
                    if (preset === 'vscode' || preset === 'intellij') dispatch({ type: 'keymapChanged', preset });
                  }}
                >
                  <option value="vscode">VS Code</option>
                  <option value="intellij">IntelliJ</option>
                </select>
                <span className="sr-only" id="keymap-help">{keymapHint} Browser and system shortcuts may take priority.</span>
              </div>
              {!propertiesOpen && (
                <IconButton
                  label="Show Properties"
                  aria-controls="properties"
                  aria-expanded={false}
                  ref={showProperties}
                  onClick={toggleProperties}
                >
                  <PanelRightOpen size={16} aria-hidden="true" />
                </IconButton>
              )}
            </div>
          </div>
          <div className="editor-canvas">
            <CodeWindow title="untitled" languageId={languageId} themeId={themeId} model={model}>
              <EditorSurface
                code={workspace.document.code}
                settings={settings}
                languageSupport={languageSupport}
                onCodeChange={onCodeChange}
                focusRef={editorFocus}
              />
            </CodeWindow>
            <p id="editor-help" className="editor-help">Tab indents. Press Escape, then Tab to leave the editor.</p>
          </div>
        </section>
        <EditorSettings
          settings={settings}
          open={propertiesOpen}
          collapseRef={collapseProperties}
          onCollapse={toggleProperties}
          onLanguageApplied={onLanguageApplied}
          dispatch={dispatch}
        />
      </main>

      <footer className="app-footer" role="status" aria-label="Editor status" aria-live="off">
        <span>{languages[languageId].label}</span>
        <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
      </footer>
    </div>
  );
}
