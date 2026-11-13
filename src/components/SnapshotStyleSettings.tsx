import { useEffect, useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { presentationRanges, snapshotFonts, validPresentationNumber } from '../snapshot/presentation';
import type { FontId, PresentationNumber, SnapshotPresentation } from '../snapshot/presentation';

export function PropertyGroup({ label, children, initiallyOpen = false }: {
  label: string;
  children: ReactNode;
  initiallyOpen?: boolean;
}) {
  return (
    <details className="property-group" open={initiallyOpen}>
      <summary><ChevronRight size={14} aria-hidden="true" />{label}</summary>
      <div className="property-group-fields">{children}</div>
    </details>
  );
}

function NumberProperty({ label, field, value, onChange }: {
  label: string;
  field: PresentationNumber;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const { min, max, step } = presentationRanges[field];
  const unit = field === 'lineHeight' ? '×' : 'px';

  function apply() {
    if (draft === null) return;
    const parsed = Number(draft);
    if (!/^\s*\d+(?:\.\d*)?\s*$/.test(draft) || !validPresentationNumber(field, parsed)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(null);
    onChange(parsed);
  }

  return (
    <div className="property-field">
      <label htmlFor={id}>{label}</label>
      <div className="number-property">
        <input id={id} type="text" inputMode={step === 1 ? 'numeric' : 'decimal'}
          aria-invalid={invalid || undefined} aria-describedby={`${id}-range${invalid ? ` ${id}-error` : ''}`}
          value={draft ?? String(value)} onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={apply} onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) apply();
          }} />
        <span aria-hidden="true">{unit}</span>
      </div>
      <span className="sr-only" id={`${id}-range`}>Range {min} to {max} {unit}, in steps of {step}.</span>
      {invalid && <p className="property-error" id={`${id}-error`} role="alert">Enter {min}–{max} {unit} in steps of {step}.</p>}
    </div>
  );
}

const localFontIds = ['consolas', 'courier', 'menlo'] as const;
let localFonts: Promise<FontId[]> | undefined;

function detectLocalFonts() {
  localFonts ??= Promise.all(localFontIds.map(async (id) => {
    if (typeof FontFace === 'undefined') return null;
    const name = snapshotFonts[id].label;
    try {
      const probe = new FontFace('Local monospace probe', `local("${name}"), local("${name.replaceAll(' ', '')}")`);
      await probe.load();
      return id;
    } catch {
      return null;
    }
  })).then((available) => ['default', ...available.filter((id) => id !== null)]);
  return localFonts;
}

function FontProperty({ value, onChange }: { value: FontId; onChange: (value: FontId) => void }) {
  const [available, setAvailable] = useState<FontId[]>(['default']);
  useEffect(() => {
    let active = true;
    void detectLocalFonts().then((fonts) => { if (active) setAvailable(fonts); });
    return () => { active = false; };
  }, []);
  const selected = available.includes(value) ? value : 'default';

  return (
    <>
      <div className="property-field">
        <label htmlFor="snapshot-font">Font</label>
        <select id="snapshot-font" value={selected} aria-describedby="snapshot-font-help"
          onChange={(event) => {
            const id = available.find((font) => font === event.currentTarget.value);
            if (id) onChange(id);
          }}>
          {available.map((id) => <option key={id} value={id}>{snapshotFonts[id].label}</option>)}
        </select>
      </div>
      <p className="property-note" id="snapshot-font-help">
        {value === selected ? '' : 'Local font unavailable. '}
        Font stack: {snapshotFonts[value].family}.
      </p>
    </>
  );
}

export function SnapshotStyleSettings({ presentation, onChange }: {
  presentation: SnapshotPresentation;
  onChange: (presentation: SnapshotPresentation) => void;
}) {
  function set<Key extends keyof SnapshotPresentation>(key: Key, value: SnapshotPresentation[Key]) {
    onChange({ ...presentation, [key]: value });
  }

  function number(label: string, field: PresentationNumber) {
    return <NumberProperty label={label} field={field} value={presentation[field]} onChange={(value) => set(field, value)} />;
  }

  return (
    <>
      <PropertyGroup label="Window">
        <div className="property-field">
          <label htmlFor="window-title">Title</label>
          <input id="window-title" type="text" value={presentation.title} translate="no"
            onChange={(event) => set('title', event.currentTarget.value)} />
        </div>
        <label className="property-check">Language icon
          <input type="checkbox" checked={presentation.showLanguageIcon}
            onChange={(event) => set('showLanguageIcon', event.currentTarget.checked)} />
        </label>
        {number('Radius', 'radius')}
        <label className="property-check">Shadow
          <input type="checkbox" checked={presentation.shadowEnabled}
            onChange={(event) => set('shadowEnabled', event.currentTarget.checked)} />
        </label>
        <div className="property-field">
          <label htmlFor="shadow-strength">Shadow strength</label>
          <select id="shadow-strength" value={presentation.shadowStrength} disabled={!presentation.shadowEnabled}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (value === 'low' || value === 'medium' || value === 'high') set('shadowStrength', value);
            }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </PropertyGroup>
      <PropertyGroup label="Background">
        <div className="property-field">
          <label htmlFor="background-color">Color</label>
          <input id="background-color" type="color" value={presentation.backgroundColor} disabled={presentation.transparent}
            onInput={(event) => set('backgroundColor', event.currentTarget.value)}
            onChange={(event) => set('backgroundColor', event.currentTarget.value)} />
        </div>
        {number('Background padding', 'backgroundPadding')}
        <label className="property-check">Transparent
          <input type="checkbox" checked={presentation.transparent}
            onChange={(event) => set('transparent', event.currentTarget.checked)} />
        </label>
      </PropertyGroup>
      <PropertyGroup label="Typography">
        <FontProperty value={presentation.fontId} onChange={(id) => set('fontId', id)} />
        {number('Font size', 'fontSize')}
        {number('Line height', 'lineHeight')}
        {number('Code padding', 'codePadding')}
      </PropertyGroup>
    </>
  );
}
