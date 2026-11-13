import { Braces, CodeXml, Database, FileCode, FileText, Hash, Paintbrush, Terminal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { EditorThemeId, LanguageId } from '../state/workspace';
import { getBasicTheme } from '../theme/basicThemes';
import './code-window.css';

const languageIcons: Record<LanguageId, LucideIcon> = {
  plaintext: FileCode, java: FileCode, kotlin: FileCode, javascript: Braces, typescript: Braces,
  python: FileCode, sql: Database, json: Braces, yaml: Hash, html: CodeXml, css: Paintbrush,
  xml: CodeXml, shell: Terminal, markdown: FileText,
};

type CodeWindowProps = {
  title: string;
  languageId: LanguageId;
  themeId: EditorThemeId;
  children: ReactNode;
};

export function CodeWindow({ title, languageId, themeId, children }: CodeWindowProps) {
  const theme = getBasicTheme(themeId);
  const LanguageIcon = languageIcons[languageId];
  const colors = {
    '--code-background': theme.background,
    '--code-header': theme.header,
    '--code-border': theme.border,
    '--code-title': theme.muted,
  } as CSSProperties;

  return (
    <div className="code-window" data-syntax-theme={themeId} style={colors}>
      <div className="code-window-header">
        <span className="window-lights" aria-hidden="true"><i /><i /><i /></span>
        <span className="code-window-title" title={title} translate="no">
          <LanguageIcon size={16} aria-hidden="true" />
          <span>{title}</span>
        </span>
      </div>
      {children}
    </div>
  );
}
