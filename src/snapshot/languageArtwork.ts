import * as braces from 'lucide-react/icons/braces';
import * as codeXml from 'lucide-react/icons/code-xml';
import * as database from 'lucide-react/icons/database';
import * as fileCode from 'lucide-react/icons/file-code';
import * as fileText from 'lucide-react/icons/file-text';
import * as hash from 'lucide-react/icons/hash';
import * as paintbrush from 'lucide-react/icons/paintbrush';
import * as terminal from 'lucide-react/icons/terminal';
import type { LanguageId } from '../state/workspace';
import { escapeXml } from './xmlText';

export const languageArtwork = {
  plaintext: fileCode, java: fileCode, kotlin: fileCode, javascript: braces, typescript: braces,
  python: fileCode, sql: database, json: braces, yaml: hash, html: codeXml, css: paintbrush,
  xml: codeXml, shell: terminal, markdown: fileText,
} satisfies Record<LanguageId, typeof fileCode>;

export function serializeLanguageArtwork(id: LanguageId): string {
  // The pinned Lucide package exports its icon data at runtime alongside the React component.
  const { __iconData } = languageArtwork[id] as unknown as {
    __iconData: { node: readonly (readonly [string, Record<string, string | number>])[] };
  };
  return __iconData.node.map(([name, attributes]) => {
    const props = Object.entries(attributes).filter(([key]) => key !== 'key')
      .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`).join('');
    return `<${name}${props}/>`;
  }).join('');
}
