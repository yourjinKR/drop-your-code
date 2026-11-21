import type { Ref } from 'react';
import { CircleAlert } from 'lucide-react';
import type { LanguageId } from '../state/workspace';
import { isLanguageId, languageIds, languages } from './languages';
import type { LanguageChangeController } from './useLanguageChange';

export function LanguageSelect({ appliedId, languageChange, selectRef }: {
  appliedId: LanguageId;
  languageChange: LanguageChangeController;
  selectRef: Ref<HTMLSelectElement>;
}) {
  const { request, chooseLanguage } = languageChange;
  return (
    <div className="property-field">
      <label htmlFor="editor-language">Language</label>
      <select
        id="editor-language"
        name="language"
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
  );
}

export function LanguageChangeFeedback({ request, onRetry }: {
  request: LanguageChangeController['request'];
  onRetry: (id: LanguageId) => void;
}) {
  return (
    <>
      <p role="status" className="language-message">
        {request?.status === 'loading' ? `Loading ${languages[request.id].label}…` : ''}
      </p>
      {request?.status === 'failed' && (
        <div className="language-error">
          <p role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>Could not load {languages[request.id].label}. Check your connection and retry. If it still fails,
              save a copy of your code before refreshing.</span>
          </p>
          <button type="button" onClick={() => onRetry(request.id)}>Retry</button>
        </div>
      )}
    </>
  );
}
