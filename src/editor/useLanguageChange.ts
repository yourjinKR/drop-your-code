import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LanguageId } from '../state/workspace';
import { loadLanguage } from './languages';
import type { LoadedLanguage } from './languages';

type LanguageRequest = { id: LanguageId; status: 'loading' | 'failed' };

export type LanguageChangeController = {
  request: LanguageRequest | null;
  chooseLanguage: (id: LanguageId) => void;
};

export function useLanguageChange(
  appliedId: LanguageId,
  onApplied: (id: LanguageId, language: LoadedLanguage | null) => void,
): LanguageChangeController {
  const [request, setRequest] = useState<LanguageRequest | null>(null);
  const latest = useRef(0);

  useLayoutEffect(() => () => { latest.current += 1; }, []);

  const chooseLanguage = useCallback((id: LanguageId) => {
    const version = ++latest.current;
    if (id === appliedId) {
      setRequest(null);
      return;
    }

    setRequest({ id, status: 'loading' });
    void loadLanguage(id).then((support) => {
      if (version !== latest.current) return;
      onApplied(id, support);
      setRequest(null);
    }, () => {
      if (version === latest.current) setRequest({ id, status: 'failed' });
    });
  }, [appliedId, onApplied]);

  return { request, chooseLanguage };
}
