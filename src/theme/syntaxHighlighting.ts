import { tags } from '@lezer/highlight';
import type { Tag } from '@lezer/highlight';
import type { EditorThemeId } from '../state/workspace';
import { getBasicTheme } from './basicThemes';

export type SyntaxStyle = Readonly<{
  color?: string;
  fontStyle?: 'italic';
  fontWeight?: 'bold';
  textDecoration?: 'line-through';
}>;

export function syntaxRules(id: EditorThemeId): (SyntaxStyle & { tag: Tag | Tag[] })[] {
  const colors = getBasicTheme(id).syntax;
  return [
    { tag: [tags.keyword, tags.modifier], color: colors.keyword },
    { tag: [tags.string, tags.special(tags.string)], color: colors.string },
    { tag: tags.comment, color: colors.comment },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: colors.literal },
    { tag: [tags.typeName, tags.className, tags.tagName, tags.heading], color: colors.type },
    { tag: [tags.propertyName, tags.attributeName, tags.function(tags.variableName), tags.link], color: colors.property },
    { tag: [tags.regexp, tags.escape], color: colors.escape },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
  ];
}
