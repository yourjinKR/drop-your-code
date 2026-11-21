import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { EditorThemeId, LanguageId } from '../state/workspace';
import type { SnapshotModel } from '../snapshot/model';
import {
  minSnapshotWindowWidth, snapshotFonts, snapshotShadows, snapshotTabSize, windowHeaderHeight, windowHeaderPadding, windowLights,
} from '../snapshot/presentation';
import type { SnapshotPresentation } from '../snapshot/presentation';
import { formatWindowTitle } from '../snapshot/windowTitle';
import { getBasicTheme } from '../theme/basicThemes';
import './code-window.css';

type CodeWindowProps = {
  presentation: SnapshotPresentation;
  languageId: LanguageId;
  themeId: EditorThemeId;
  model: SnapshotModel | null;
  onTitleChange: (title: string) => void;
  children: ReactNode;
};

function EditableWindowTitle({ title, displayTitle, onChange }: {
  title: string;
  displayTitle: string;
  onChange: (title: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const editing = draft !== null;

  useLayoutEffect(() => {
    if (!editing && restoreFocus.current) {
      restoreFocus.current = false;
      trigger.current?.focus();
    }
  }, [editing]);

  function finish(value: string | null, focusButton = false) {
    if (value !== null && value !== title) onChange(value);
    restoreFocus.current = focusButton;
    setDraft(null);
  }

  if (editing) {
    return <input className="code-window-title" type="text" aria-label="Window title" translate="no" autoFocus
      autoCapitalize="none" autoCorrect="off" spellCheck={false}
      value={draft} onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={(event) => finish(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || (event.key !== 'Enter' && event.key !== 'Escape')) return;
        event.preventDefault();
        finish(event.key === 'Enter' ? event.currentTarget.value : null, true);
      }} />;
  }

  return <button className="code-window-title" type="button" ref={trigger}
    aria-label={displayTitle ? `${displayTitle}, edit title` : 'Add title'}
    title={displayTitle || undefined} translate={displayTitle ? 'no' : undefined} onClick={() => setDraft(title)}>
    {displayTitle || 'Add title'}
  </button>;
}

export function CodeWindow({ presentation, languageId, themeId, model, onTitleChange, children }: CodeWindowProps) {
  const theme = getBasicTheme(themeId);
  const { title, fontId, fontSize, lineHeight, codePadding, radius, shadowEnabled, shadowStrength, showTitle } = presentation;
  const shadow = snapshotShadows[shadowStrength];
  const colors = {
    '--code-background': theme.background,
    '--code-header': theme.header,
    '--code-title-border': theme.border,
    '--code-title': theme.muted,
    '--code-window-width': `${model?.window.width ?? minSnapshotWindowWidth}px`,
    '--code-content-height': `${model?.editorContentHeight ?? Math.ceil(2 * codePadding + fontSize * lineHeight)}px`,
    '--code-gutter-width': model?.gutter ? `${model.gutter}px` : 'auto',
    '--code-header-height': `${windowHeaderHeight}px`,
    '--code-header-padding': `${windowHeaderPadding}px`,
    '--code-light-size': `${windowLights.diameter}px`,
    '--code-light-gap': `${windowLights.gap}px`,
    '--code-font': snapshotFonts[fontId].family,
    '--code-font-size': `${fontSize}px`,
    '--code-line-height': lineHeight,
    '--code-padding': `${codePadding}px`,
    '--code-tab-size': snapshotTabSize,
    '--code-radius': `${radius}px`,
    '--code-shadow': shadowEnabled ? `0 ${shadow.offsetY}px ${shadow.blur * 2}px rgb(0 0 0 / ${shadow.opacity})` : 'none',
  } as CSSProperties;

  return (
    <div className="code-window" data-syntax-theme={themeId} style={colors}>
      <div className="code-window-header">
        <span className="window-lights" aria-hidden="true">
          {windowLights.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
        </span>
        {showTitle && <EditableWindowTitle title={title} displayTitle={formatWindowTitle(title, languageId)}
          onChange={onTitleChange} />}
      </div>
      {children}
    </div>
  );
}
