import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DEFAULT_RASTER_SCALE } from '../export/encodeSnapshot';
import type { SnapshotExportOptions } from '../export/encodeSnapshot';
import { IconButton } from './ui/IconButton';

type Format = SnapshotExportOptions['format'];

type ExportSettingsProps = {
  format: Format;
  onFormatChange: (format: Format) => void;
  jpgBackground: string;
  onJpgBackgroundChange: (color: string) => void;
  dimensions: { width: number; height: number } | null;
};

export function ExportSettings({ format, onFormatChange, jpgBackground, onJpgBackgroundChange, dimensions }: ExportSettingsProps) {
  const [open, setOpen] = useState(false);
  const settings = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !settings.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, [open]);

  return (
    <div className="export-settings" ref={settings}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (!open || event.key !== 'Escape') return;
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }}>
      <IconButton className="icon-button export-settings-trigger" ref={trigger} label="Export settings"
        aria-expanded={open} aria-controls="export-settings" onClick={() => setOpen((current) => !current)}>
        <ChevronDown size={16} aria-hidden="true" />
      </IconButton>
      <div className="export-settings-panel" id="export-settings" role="group" aria-label="Export settings" hidden={!open}>
        <div className="property-field">
          <label htmlFor="export-format">Format</label>
          <select id="export-format" value={format} onChange={(event) => {
            const selected = event.currentTarget.value;
            if (selected === 'png' || selected === 'svg' || selected === 'jpg' || selected === 'webp') onFormatChange(selected);
          }}>
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        {format === 'jpg' && <div className="property-field">
          <label htmlFor="jpg-background">JPG background</label>
          <input id="jpg-background" type="color" value={jpgBackground} onChange={(event) => {
            const color = event.currentTarget.value;
            if (/^#[0-9a-f]{6}$/i.test(color)) onJpgBackgroundChange(color);
          }} />
        </div>}
        <p className="property-note">Snapshot size {dimensions ? `${dimensions.width} × ${dimensions.height} px` : '—'}</p>
        <p className="property-note">
          {format === 'svg' ? 'SVG uses the snapshot size.' : dimensions
            ? `${DEFAULT_RASTER_SCALE}× output ${dimensions.width * DEFAULT_RASTER_SCALE} × ${dimensions.height * DEFAULT_RASTER_SCALE} px`
            : `${DEFAULT_RASTER_SCALE}× output —`}
        </p>
      </div>
    </div>
  );
}
