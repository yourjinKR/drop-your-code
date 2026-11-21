import { useLayoutEffect } from 'react';

export function isCompositionKey(event: KeyboardEvent) {
  return event.isComposing || event.keyCode === 229;
}

export function usePaletteShortcuts(isMac: boolean, open: (mode: 'all') => void) {
  useLayoutEffect(() => {
    let composing: EventTarget | null = null;
    const startComposition = (event: Event) => { composing = event.target; };
    const endComposition = (event: Event) => {
      if (composing === event.target) composing = null;
    };

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || !event.cancelable || event.altKey || isCompositionKey(event)
        || (composing !== null && composing === event.target) || !event.shiftKey) return;
      if (isMac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) return;
      // Shift changes the character of the period key on many layouts.
      const isPeriodKey = event.code ? event.code === 'Period' : event.key === '.' || event.key === '>';
      if (!isPeriodKey) return;

      // Capture before CodeMirror or a native input can insert a character.
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) open('all');
    }

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('compositionstart', startComposition, true);
    window.addEventListener('compositionend', endComposition, true);
    window.addEventListener('blur', endComposition, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('compositionstart', startComposition, true);
      window.removeEventListener('compositionend', endComposition, true);
      window.removeEventListener('blur', endComposition, true);
    };
  }, [isMac, open]);
}
