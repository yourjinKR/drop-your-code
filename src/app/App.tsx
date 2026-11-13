import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CodeXml, Download, Eye, Maximize, Minus, Moon, PanelRightOpen, Plus, SquareCode, Sun } from 'lucide-react';
import type { LanguageSupport } from '@codemirror/language';
import type { KeyboardEvent } from 'react';
import { CodeWindow } from '../components/CodeWindow';
import { EditorSettings } from '../components/EditorSettings';
import { IconButton } from '../components/ui/IconButton';
import { EditorSurface } from '../editor/EditorSurface';
import { detectPlatform } from '../editor/keymaps';
import { languages } from '../editor/languages';
import { DEFAULT_RASTER_SCALE } from '../export/encodeSnapshot';
import type { SnapshotExportOptions } from '../export/encodeSnapshot';
import { useSnapshotExport } from '../export/useSnapshotExport';
import { SnapshotPreview, previewZoomLevels } from '../snapshot/SnapshotPreview';
import { useSnapshotModel } from '../snapshot/useSnapshotModel';
import { createInitialWorkspace, selectSnapshotInput, workspaceReducer } from '../state/workspace';
import type { LanguageId } from '../state/workspace';

type UiTheme = 'dark' | 'light';
type Mode = 'editor' | 'preview';

export function App() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, createInitialWorkspace);
  const [languageSupport, setLanguageSupport] = useState<LanguageSupport | null>(null);
  const [uiTheme, setUiTheme] = useState<UiTheme>('dark');
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [mode, setMode] = useState<Mode>('editor');
  const [tabStop, setTabStop] = useState<Mode>('editor');
  const [zoom, setZoom] = useState<number | null>(null);
  const [format, setFormat] = useState<SnapshotExportOptions['format']>('png');
  const [previewDisplay, setPreviewDisplay] = useState({ scale: 1, width: 0, height: 0 });
  const editorTab = useRef<HTMLButtonElement>(null);
  const previewTab = useRef<HTMLButtonElement>(null);
  const focusEditorOnShow = useRef(false);
  const editorFocus = useRef<(() => void) | null>(null);
  const showProperties = useRef<HTMLButtonElement>(null);
  const collapseProperties = useRef<HTMLButtonElement>(null);
  const movePanelFocus = useRef(false);

  const { settings } = workspace;
  const languageId = settings.language.languageId;
  const { themeId, lineNumbers, wrap, presentation } = settings;
  const input = useMemo(() => selectSnapshotInput(workspace), [workspace.document, languageId, themeId, lineNumbers, wrap, presentation]);
  const snapshot = useSnapshotModel(input);
  const currentModel = snapshot.status === 'ready' ? snapshot.model : null;
  const output = useSnapshotExport(input, currentModel, format === 'svg' ? { format } : { format, scale: DEFAULT_RASTER_SCALE });
  const previewActive = mode === 'preview';
  const zoomIn = previewZoomLevels.find((value) => value > previewDisplay.scale);
  const zoomOut = previewZoomLevels.filter((value) => value < previewDisplay.scale).at(-1);
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
  const onDisplay = useCallback((scale: number, width: number, height: number) => {
    setPreviewDisplay((previous) => previous.scale === scale && previous.width === width && previous.height === height
      ? previous : { scale, width, height });
  }, []);

  useLayoutEffect(() => {
    if (mode === 'editor' && focusEditorOnShow.current) {
      focusEditorOnShow.current = false;
      editorFocus.current?.();
    }
  }, [mode]);

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

  function activateTab(next: Mode) {
    setMode(next);
    setTabStop(next);
  }

  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    let next: Mode;
    switch (event.key) {
      case 'Home': next = 'editor'; break;
      case 'End': next = 'preview'; break;
      case 'ArrowRight':
      case 'ArrowLeft': next = event.target === editorTab.current ? 'preview' : 'editor'; break;
      default: return;
    }
    event.preventDefault();
    setTabStop(next);
    (next === 'editor' ? editorTab : previewTab).current?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace" onClick={() => activateTab('editor')}>Skip to editor</a>

      <header className="app-header">
        <span className="brand-mark"><CodeXml size={20} aria-hidden="true" /></span>
        <h1 translate="no">Drop Your Code</h1>
        <div className="export-actions">
          <button className="export-button" type="button" aria-disabled={output.busy} aria-busy={output.busy}
            onClick={output.exportImage}>
            <Download size={16} aria-hidden="true" />{output.busy ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </header>

      <div className="export-feedback">
        <p role="status" aria-label="Image output status">{output.message}</p>
        {output.error && <p role="alert">{output.error}</p>}
      </div>

      <div className="activity-bar" role="group" aria-label="Workspace controls">
        <IconButton label="Focus editor" onClick={() => {
          if (previewActive) {
            focusEditorOnShow.current = true;
            activateTab('editor');
          } else editorFocus.current?.();
        }}>
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
        aria-label="Workspace"
        tabIndex={-1}
        data-properties-open={propertiesOpen}
      >
        <section className="workspace-editor" aria-label="Code workspace">
          <div className="workspace-header">
            <div className="workspace-tabs" role="tablist" aria-label="Workspace view" onKeyDown={moveTab}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setTabStop(mode);
              }}>
              <button type="button" role="tab" ref={editorTab} id="editor-tab" aria-controls="editor-panel"
                aria-selected={!previewActive} tabIndex={tabStop === 'editor' ? 0 : -1} onClick={() => activateTab('editor')}>
                <SquareCode size={16} aria-hidden="true" />Editor
              </button>
              <button type="button" role="tab" ref={previewTab} id="preview-tab" aria-controls="preview-panel"
                aria-selected={previewActive} tabIndex={tabStop === 'preview' ? 0 : -1} onClick={() => activateTab('preview')}>
                <Eye size={16} aria-hidden="true" />Preview
              </button>
            </div>
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
          <div className="editor-canvas" id="editor-panel" role="tabpanel" aria-labelledby="editor-tab" hidden={previewActive}>
            <CodeWindow presentation={presentation} languageId={languageId} themeId={themeId} model={snapshot.model}>
              <EditorSurface
                code={workspace.document.code}
                settings={settings}
                languageSupport={languageSupport}
                onCodeChange={onCodeChange}
                focusRef={editorFocus}
                visible={!previewActive}
              />
            </CodeWindow>
            <p id="editor-help" className="editor-help">Tab indents. Press Escape, then Tab to leave the editor.</p>
          </div>
          <SnapshotPreview active={previewActive} {...snapshot} zoom={zoom} onDisplay={onDisplay} />
        </section>
        <EditorSettings
          settings={settings}
          format={format}
          onFormatChange={setFormat}
          dimensions={currentModel}
          open={propertiesOpen}
          collapseRef={collapseProperties}
          onCollapse={toggleProperties}
          onLanguageApplied={onLanguageApplied}
          dispatch={dispatch}
        />
      </main>

      <footer className="app-footer">
        <div className="editor-status" role="status" aria-label="Editor status" aria-live="off">
          <span>{languages[languageId].label}</span>
          <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>
        {previewActive && <div className="preview-zoom" role="group" aria-label="Preview zoom">
          {previewDisplay.width > 0 && <span className="preview-dimensions">{previewDisplay.width} × {previewDisplay.height} px</span>}
          <IconButton label="Zoom out" disabled={zoomOut === undefined || !previewDisplay.width}
            onClick={() => zoomOut !== undefined && setZoom(zoomOut)}><Minus size={14} aria-hidden="true" /></IconButton>
          <span className="preview-scale">{previewDisplay.width ? `${Number((previewDisplay.scale * 100).toFixed(1))}%` : '—'}</span>
          <IconButton label="Zoom in" disabled={zoomIn === undefined || !previewDisplay.width}
            onClick={() => zoomIn !== undefined && setZoom(zoomIn)}><Plus size={14} aria-hidden="true" /></IconButton>
          <IconButton label="Fit" aria-pressed={zoom === null} onClick={() => setZoom(null)}><Maximize size={14} aria-hidden="true" /></IconButton>
        </div>}
      </footer>
    </div>
  );
}
