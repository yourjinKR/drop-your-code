import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CodeXml, Copy, Download, LoaderCircle, Moon, PanelRightOpen, Search, SquareCode, Sun } from 'lucide-react';
import { CommandPalette } from '../commands/CommandPalette';
import { getCommands } from '../commands/registry';
import type { PaletteMode } from '../commands/registry';
import { usePaletteShortcuts } from '../commands/usePaletteShortcuts';
import { CodeWindow } from '../components/CodeWindow';
import { EditorSettings } from '../components/EditorSettings';
import { ExportSettings } from '../components/ExportSettings';
import { LiveCanvas } from '../components/LiveCanvas';
import { IconButton } from '../components/ui/IconButton';
import { EditorSurface } from '../editor/EditorSurface';
import { detectPlatform, keymapLabels, keymapPresets } from '../editor/keymaps';
import { LanguageChangeFeedback } from '../editor/LanguageSelect';
import { languages } from '../editor/languages';
import type { LoadedLanguage } from '../editor/languages';
import { useLanguageChange } from '../editor/useLanguageChange';
import { DEFAULT_JPG_BACKGROUND, DEFAULT_RASTER_SCALE } from '../export/encodeSnapshot';
import type { SnapshotExportOptions } from '../export/encodeSnapshot';
import { useSnapshotExport } from '../export/useSnapshotExport';
import { useSnapshotModel } from '../snapshot/useSnapshotModel';
import { createInitialWorkspace, selectSnapshotInput, workspaceReducer } from '../state/workspace';
import type { LanguageId } from '../state/workspace';

type UiTheme = 'dark' | 'light';

function optionsForFormat(format: SnapshotExportOptions['format'], jpgBackground: string): SnapshotExportOptions {
  if (format === 'svg') return { format };
  if (format === 'jpg') return { format, scale: DEFAULT_RASTER_SCALE, backgroundColor: jpgBackground };
  return { format, scale: DEFAULT_RASTER_SCALE };
}

export function App() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, createInitialWorkspace);
  const [language, setLanguage] = useState<LoadedLanguage | null>(null);
  const [uiTheme, setUiTheme] = useState<UiTheme>('dark');
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [format, setFormat] = useState<SnapshotExportOptions['format']>('png');
  const [jpgBackground, setJpgBackground] = useState(DEFAULT_JPG_BACKGROUND);
  const [paletteMode, setPaletteMode] = useState<PaletteMode | null>(null);
  const editorFocus = useRef<(() => void) | null>(null);
  const resetCanvas = useRef<(() => void) | null>(null);
  const paletteTrigger = useRef<HTMLButtonElement>(null);
  const languageSelect = useRef<HTMLSelectElement>(null);
  const showProperties = useRef<HTMLButtonElement>(null);
  const collapseProperties = useRef<HTMLButtonElement>(null);
  const movePanelFocus = useRef(false);

  const { settings } = workspace;
  const languageId = settings.language.languageId;
  const { themeId, lineNumbers, wrap, presentation } = settings;
  const input = useMemo(() => selectSnapshotInput(workspace), [workspace.document, languageId, themeId, lineNumbers, wrap, presentation]);
  const snapshot = useSnapshotModel(input);
  const currentModel = snapshot.status === 'ready' ? snapshot.model : null;
  const exportOptions = optionsForFormat(format, jpgBackground);
  const output = useSnapshotExport(input, currentModel, exportOptions);
  const copyLabel = output.action === 'copy' ? 'Copying…' : 'Copy Image';
  const lineCount = workspace.document.code.split('\n').length;
  const isMac = detectPlatform() === 'macos';
  const paletteShortcut = isMac ? 'Cmd+Shift+.' : 'Ctrl+Shift+.';
  usePaletteShortcuts(isMac, setPaletteMode);
  const keymapHint = isMac
    ? settings.keymap === 'intellij'
      ? 'In the editor, Cmd+Backspace deletes a line. Cmd+Shift+Z is Redo.'
      : 'In the editor, Cmd+Shift+K deletes a line. Cmd+Shift+Z is Redo.'
    : settings.keymap === 'intellij'
      ? 'In the editor, Ctrl+Y deletes a line. Ctrl+Shift+Z is Redo.'
      : 'In the editor, Ctrl+Y is Redo.';

  const onLanguageApplied = useCallback((id: LanguageId, loaded: LoadedLanguage | null) => {
    setLanguage(loaded);
    dispatch({ type: 'languageChanged', languageId: id });
  }, []);
  const languageChange = useLanguageChange(languageId, onLanguageApplied);
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
      <a className="skip-link" href="#workspace" onClick={(event) => {
        event.preventDefault();
        editorFocus.current?.();
      }}>Skip to editor</a>

      <header className="app-header">
        <span className="brand-mark"><CodeXml size={20} aria-hidden="true" /></span>
        <h1 translate="no">Drop Your Code</h1>
        <div className="export-actions">
          <IconButton className="copy-button" label={copyLabel} aria-disabled={output.busy}
            aria-busy={output.action === 'copy'} onClick={output.copyImage}>
            {output.action === 'copy' ? <LoaderCircle className="copy-progress" size={16} aria-hidden="true" />
              : <Copy size={16} aria-hidden="true" />}
            <span aria-hidden="true">{copyLabel}</span>
          </IconButton>
          <div className="export-split" role="group" aria-label="Download">
            <button className="export-button" type="button" aria-disabled={output.busy} aria-busy={output.action === 'export'}
              onClick={() => { void output.exportImage(); }}>
              <Download size={16} aria-hidden="true" />{output.action === 'export' ? 'Exporting…' : 'Export'}
            </button>
            <ExportSettings format={format} onFormatChange={setFormat} jpgBackground={jpgBackground}
              onJpgBackgroundChange={setJpgBackground} dimensions={currentModel} />
          </div>
        </div>
      </header>

      <div className="workspace-feedback">
        <p role="status" aria-label="Image output status">{output.message}</p>
        {output.error && <p role="alert">{output.error}</p>}
        <LanguageChangeFeedback request={languageChange.request} onRetry={(id) => {
          languageSelect.current?.focus();
          if (document.activeElement !== languageSelect.current) paletteTrigger.current?.focus();
          languageChange.chooseLanguage(id);
        }} />
      </div>

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
        aria-label="Workspace"
        tabIndex={-1}
        data-properties-open={propertiesOpen}
      >
        <section className="workspace-editor" aria-label="Code workspace">
          <div className="workspace-header">
            <h2>Canvas</h2>
            <div className="workspace-controls">
              <button className="commands-trigger" ref={paletteTrigger} type="button" aria-label="Commands"
                aria-haspopup="dialog" aria-keyshortcuts={isMac ? 'Meta+Shift+.' : 'Control+Shift+.'}
                title={`Commands (${paletteShortcut})`} onClick={(event) => {
                  event.currentTarget.focus({ preventScroll: true });
                  setPaletteMode('all');
                }}>
                <Search size={16} aria-hidden="true" />
                <span>Commands</span>
                <kbd aria-hidden="true">{paletteShortcut}</kbd>
              </button>
              <div className="keymap-control">
                <label htmlFor="keymap">Keymap</label>
                <select
                  id="keymap"
                  name="keymap"
                  value={settings.keymap}
                  aria-describedby="keymap-help"
                  onChange={(event) => {
                    const preset = keymapPresets.find((id) => id === event.currentTarget.value);
                    if (preset) dispatch({ type: 'keymapChanged', preset });
                  }}
                >
                  {keymapPresets.map((preset) => <option key={preset} value={preset}>{keymapLabels[preset]}</option>)}
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
          <LiveCanvas presentation={presentation} model={snapshot.model} failed={snapshot.status === 'error'}
            retry={snapshot.retry} resetRef={resetCanvas} jpgBackground={format === 'jpg' ? jpgBackground : undefined}>
            <CodeWindow presentation={presentation} languageId={languageId} themeId={themeId} model={snapshot.model}
              onTitleChange={(title) => dispatch({ type: 'presentationChanged', presentation: { ...presentation, title } })}>
              <EditorSurface
                code={workspace.document.code}
                settings={settings}
                language={language}
                onCodeChange={onCodeChange}
                focusRef={editorFocus}
                windowSize={snapshot.model?.window}
              />
            </CodeWindow>
          </LiveCanvas>
          <p id="editor-help" className="sr-only">Tab indents. Press Escape, then Tab to leave the editor.</p>
        </section>
        <EditorSettings
          settings={settings}
          open={propertiesOpen}
          collapseRef={collapseProperties}
          onCollapse={toggleProperties}
          languageChange={languageChange}
          languageSelectRef={languageSelect}
          dispatch={dispatch}
        />
      </main>

      <footer className="app-footer">
        <div className="editor-status" role="status" aria-label="Editor status" aria-live="off">
          <span>{languages[languageId].label}</span>
          <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>
      </footer>
      {paletteMode && <CommandPalette mode={paletteMode} onModeChange={setPaletteMode} onClose={() => setPaletteMode(null)}
        focusFallback={() => paletteTrigger.current?.focus()}
        commands={getCommands(paletteMode, {
          settings,
          dispatch,
          chooseLanguage: languageChange.chooseLanguage,
          focusEditor: () => editorFocus.current?.(),
          toggleProperties,
          resetCanvas: () => resetCanvas.current?.(),
          copyImage: output.copyImage,
          exportImage: (requestedFormat) => { void output.exportImage(optionsForFormat(requestedFormat, jpgBackground)); },
          exportBusy: output.busy,
        })} />}
    </div>
  );
}
