import { PanelRightClose } from 'lucide-react';
import type { LanguageSupport } from '@codemirror/language';
import type { Dispatch, Ref } from 'react';
import { LanguageSelect } from '../editor/LanguageSelect';
import { DEFAULT_RASTER_SCALE } from '../export/encodeSnapshot';
import type { SnapshotExportOptions } from '../export/encodeSnapshot';
import type { EditorSettings as Settings, LanguageId, WorkspaceAction } from '../state/workspace';
import { IconButton } from './ui/IconButton';
import { PropertyGroup, SnapshotStyleSettings } from './SnapshotStyleSettings';

type EditorSettingsProps = {
  settings: Settings;
  format: SnapshotExportOptions['format'];
  onFormatChange: (format: SnapshotExportOptions['format']) => void;
  dimensions: { width: number; height: number } | null;
  open: boolean;
  collapseRef: Ref<HTMLButtonElement>;
  onCollapse: () => void;
  onLanguageApplied: (id: LanguageId, support: LanguageSupport | null) => void;
  dispatch: Dispatch<WorkspaceAction>;
};

export function EditorSettings({ settings, format, onFormatChange, dimensions, open, collapseRef, onCollapse,
  onLanguageApplied, dispatch }: EditorSettingsProps) {
  return (
    <aside id="properties" className="properties-panel" aria-labelledby="properties-heading" hidden={!open}>
      <div className="properties-header">
        <h2 id="properties-heading">Properties</h2>
        <IconButton
          label="Collapse Properties"
          aria-controls="properties"
          aria-expanded={open}
          ref={collapseRef}
          onClick={onCollapse}
        >
          <PanelRightClose size={16} aria-hidden="true" />
        </IconButton>
      </div>
      <PropertyGroup label="Code" initiallyOpen>
        <LanguageSelect appliedId={settings.language.languageId} onApplied={onLanguageApplied} />
        <div className="property-field">
          <label htmlFor="syntax-theme">Syntax theme</label>
          <select
            id="syntax-theme"
            name="syntax-theme"
            value={settings.themeId}
            onChange={(event) => {
              const themeId = event.currentTarget.value;
              if (themeId === 'dark' || themeId === 'light') dispatch({ type: 'themeChanged', themeId });
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <label className="property-check">
          Line numbers
          <input type="checkbox" name="line-numbers" checked={settings.lineNumbers}
            onChange={(event) => dispatch({ type: 'lineNumbersChanged', enabled: event.currentTarget.checked })} />
        </label>
        <label className="property-check">
          Wrap lines
          <input type="checkbox" name="wrap-lines" checked={settings.wrap}
            onChange={(event) => dispatch({ type: 'wrapChanged', enabled: event.currentTarget.checked })} />
        </label>
      </PropertyGroup>
      <SnapshotStyleSettings presentation={settings.presentation}
        onChange={(presentation) => dispatch({ type: 'presentationChanged', presentation })} />
      <PropertyGroup label="Export">
        <div className="property-field">
          <label htmlFor="export-format">Format</label>
          <select id="export-format" value={format} onChange={(event) => {
            const selected = event.currentTarget.value;
            if (selected === 'png' || selected === 'svg') onFormatChange(selected);
          }}>
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </select>
        </div>
        <p className="property-note">
          Snapshot size {dimensions ? `${dimensions.width} × ${dimensions.height} px` : '—'}
        </p>
        <p className="property-note">
          {format === 'svg' ? 'SVG uses the snapshot size.' : dimensions
            ? `${DEFAULT_RASTER_SCALE}× output ${dimensions.width * DEFAULT_RASTER_SCALE} × ${dimensions.height * DEFAULT_RASTER_SCALE} px`
            : `${DEFAULT_RASTER_SCALE}× output —`}
        </p>
      </PropertyGroup>
    </aside>
  );
}
