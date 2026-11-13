import { useEffect, useRef, useState } from 'react';
import type { LanguageSupport } from '@codemirror/language';
import type { LanguageId } from '../state/workspace';
import { isLanguageId, languageIds, languages, loadLanguage } from './languages';

type LanguageRequest = { id: LanguageId; status: 'loading' | 'failed' };

type LanguageSelectProps = {
  appliedId: LanguageId;
  onApplied: (id: LanguageId, support: LanguageSupport | null) => void;
};

export function LanguageSelect({ appliedId, onApplied }: LanguageSelectProps) {
  const [request, setRequest] = useState<LanguageRequest | null>(null);
  const latest = useRef(0);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => () => { latest.current += 1; }, []);

  function chooseLanguage(id: LanguageId) {
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
  }

  return (
    <>
      <div className="language-control">
        <label htmlFor="editor-language">Language</label>
        <select
          id="editor-language"
          ref={selectRef}
          value={request?.status === 'loading' ? request.id : appliedId}
          onChange={(event) => {
            const id = event.currentTarget.value;
            if (isLanguageId(id)) chooseLanguage(id);
          }}
        >
          {languageIds.map((id) => <option key={id} value={id}>{languages[id].label}</option>)}
        </select>
      </div>
      <p role="status" className="language-message">
        {request?.status === 'loading' ? `Loading ${languages[request.id].label}…` : ''}
      </p>
      {request?.status === 'failed' && (
        <div className="language-error">
          <p role="alert">
            Could not load {languages[request.id].label}. Check your connection and retry. If it still fails,
            save a copy of your code before refreshing.
          </p>
          <button type="button" onClick={() => {
            selectRef.current?.focus();
            chooseLanguage(request.id);
          }}>Retry</button>
        </div>
      )}
    </>
  );
}
