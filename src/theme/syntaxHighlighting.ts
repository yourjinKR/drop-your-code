import type { ThemeRegistrationRaw } from '@shikijs/primitive';
import type { EditorThemeId } from '../state/workspace';
import { getBasicTheme } from './basicThemes';

export type SyntaxStyle = Readonly<{
  color?: string;
  fontStyle?: 'italic';
  fontWeight?: 'bold';
  textDecoration?: 'line-through';
}>;

export type HighlightSpan = Readonly<{ from: number; to: number; style: SyntaxStyle }>;
export type Highlighter = (code: string, theme: EditorThemeId) => readonly HighlightSpan[];

export function textMateTheme(id: EditorThemeId): ThemeRegistrationRaw {
  const { syntax, appearance, background, foreground } = getBasicTheme(id);
  return {
    name: id,
    type: appearance,
    colors: { 'editor.background': background, 'editor.foreground': foreground },
    settings: [
      { scope: ['keyword', 'storage', 'constant.language'], settings: { foreground: syntax.keyword } },
      ...(syntax.controlFlow ? [{ scope: 'keyword.control', settings: { foreground: syntax.controlFlow } }] : []),
      { scope: ['keyword.operator', 'storage.type.function.arrow', 'storage.modifier.package', 'storage.modifier.import'],
        settings: { foreground } },
      { scope: ['string', 'punctuation.definition.string'], settings: { foreground: syntax.string } },
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: syntax.comment } },
      { scope: ['constant.numeric', 'constant.character'], settings: { foreground: syntax.literal } },
      { scope: ['support.type', 'entity.name.type', 'entity.name.tag', 'markup.heading', 'storage.type.java'],
        settings: { foreground: syntax.type } },
      { scope: ['entity.name.type.class'], settings: { foreground: syntax.className } },
      { scope: ['entity.name.function', 'support.function', 'meta.function-call.generic'],
        settings: { foreground: syntax.function } },
      ...(syntax.variable ? [{ scope: ['variable', 'meta.definition.variable.name', 'entity.name.variable'],
        settings: { foreground: syntax.variable } }] : []),
      { scope: ['support.type.property-name', 'punctuation.support.type.property-name', 'entity.other.attribute-name', 'entity.name.tag.yaml'],
        settings: { foreground: syntax.property } },
      { scope: ['storage.type.annotation', 'punctuation.definition.annotation', 'meta.annotation', 'meta.decorator'],
        settings: { foreground: syntax.annotation } },
      { scope: ['constant.character.escape', 'string.regexp'], settings: { foreground: syntax.escape } },
      { scope: 'markup.italic', settings: { fontStyle: 'italic' } },
      { scope: 'markup.bold', settings: { fontStyle: 'bold' } },
      { scope: 'markup.strikethrough', settings: { fontStyle: 'strikethrough' } },
    ],
  };
}
