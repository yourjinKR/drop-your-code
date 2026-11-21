import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CodeXml, CornerDownLeft, Download, PanelsTopLeft,
  Search, SlidersHorizontal, Terminal, X } from 'lucide-react';
import { filterCommands, runCommand } from './registry';
import type { CommandCategory, PaletteCommand, PaletteMode } from './registry';
import { isCompositionKey } from './usePaletteShortcuts';
import './command-palette.css';

const paletteLabels = {
  all: { title: 'All Commands', search: 'Search commands' },
  languages: { title: 'Change Language', search: 'Search languages' },
  themes: { title: 'Change Syntax Theme', search: 'Search syntax themes' },
  keymaps: { title: 'Change Keymap', search: 'Search keymaps' },
} satisfies Record<PaletteMode, { title: string; search: string }>;

const icons = {
  Languages: CodeXml, Appearance: SlidersHorizontal, Editor: Terminal, Workspace: PanelsTopLeft, Export: Download,
} satisfies Record<CommandCategory, typeof CodeXml>;

type PaletteProps = {
  mode: PaletteMode;
  commands: readonly PaletteCommand[];
  onModeChange: (mode: PaletteMode) => void;
  onClose: () => void;
};

export function CommandPalette({ mode, commands, onModeChange, onClose, focusFallback }: PaletteProps & {
  focusFallback: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const backdropPress = useRef(false);
  const composing = useRef(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    previousFocus.current = opener instanceof HTMLElement && opener !== document.body ? opener : null;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useLayoutEffect(() => {
    composing.current = false;
    inputRef.current?.focus();
  }, [mode]);

  function close() {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    dialog.close();
    const opener = previousFocus.current;
    if (opener?.getClientRects().length) {
      if (document.activeElement !== opener) opener.focus({ preventScroll: true });
    } else {
      focusFallback();
    }
    onClose();
  }

  return (
    <dialog className="command-palette" ref={dialogRef} aria-label={paletteLabels[mode].title} aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!composing.current) close();
      }}
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (backdropPress.current && event.target === event.currentTarget) close();
        backdropPress.current = false;
      }}>
      <PaletteContents key={mode} mode={mode} commands={commands} onModeChange={onModeChange} onClose={close}
        inputRef={inputRef} composing={composing} />
    </dialog>
  );
}

function PaletteContents({ mode, commands, onModeChange, onClose, inputRef, composing }: PaletteProps & {
  inputRef: RefObject<HTMLInputElement | null>;
  composing: RefObject<boolean>;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const switchRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const filtered = filterCommands(commands, query);
  const available = filtered.filter((item) => item.enabled !== false);
  const active = available.find((item) => item.id === selectedId) ?? available[0];
  const activeOption = active ? `${listId}-${active.id}` : undefined;
  const { title, search } = paletteLabels[mode];
  const isAll = mode === 'all';

  useLayoutEffect(() => {
    if (activeOption) document.getElementById(activeOption)?.scrollIntoView({ block: 'nearest' });
  }, [activeOption]);

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (composing.current || isCompositionKey(event.nativeEvent)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const first = inputRef.current;
      const last = switchRef.current;
      if (event.shiftKey && event.target === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && event.target === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }

    if (event.target !== inputRef.current || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (active && !event.repeat) runCommand(active, onModeChange, onClose);
    } else if (active && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const index = available.indexOf(active);
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      setSelectedId(available[(index + offset + available.length) % available.length]?.id);
    }
  }

  return (
    <div className="command-palette-content" onKeyDown={handleKey}>
      <div className="command-search">
        <Search className="command-search-icon" size={19} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={search}
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeOption}
          placeholder={`${search}…`}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId(undefined);
          }}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={() => { composing.current = false; }}
          onBlur={() => { composing.current = false; }}
        />
        <button className="command-close" type="button" aria-label="Close palette" onClick={onClose}>
          <kbd aria-hidden="true">Esc</kbd><X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="command-scroll" tabIndex={-1}>
        <div className="command-results" role="listbox" aria-label={title} id={listId}>
          {filtered.map((command) => {
            const Icon = command.current ? Check : icons[command.category];
            return (
              <div className="command-option" key={command.id} id={`${listId}-${command.id}`}
                role="option" aria-label={command.title} aria-selected={command === active}
                aria-disabled={command.enabled === false || undefined}
                aria-description={command.current ? 'Current' : undefined}
                data-current={command.current || undefined}
                onMouseDown={(event) => { event.preventDefault(); }}
                onClick={() => runCommand(command, onModeChange, onClose)}>
                <Icon size={17} aria-hidden="true" />
                <span className="command-name">{command.title}</span>
                {isAll && <span className="command-category">{command.category}</span>}
                {command.current && <span className="command-current">Current</span>}
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="command-empty" role="status">No results. Try a different search.</p>}
      </div>
      <footer className="command-footer">
        <div className="command-hints" aria-hidden="true">
          <span><kbd><ArrowUp /><ArrowDown /></kbd>Navigate</span>
          <span><kbd><CornerDownLeft /></kbd>Run</span>
        </div>
        <button className="command-switch" type="button" ref={switchRef}
          onClick={() => onModeChange(isAll ? 'languages' : 'all')}>
          {!isAll && <ArrowLeft size={14} aria-hidden="true" />}
          {isAll ? 'Browse languages' : 'All Commands'}
          {isAll && <ArrowRight size={14} aria-hidden="true" />}
        </button>
      </footer>
    </div>
  );
}
