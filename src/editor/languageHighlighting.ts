import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Readable on the current dark editor surface. Task 6 owns selectable syntax themes.
export const editorHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: '#d7a9f0' },
  { tag: [tags.string, tags.special(tags.string)], color: '#acd69e' },
  { tag: tags.comment, color: '#a2adbd' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#f3bc92' },
  { tag: [tags.typeName, tags.className, tags.tagName, tags.heading], color: '#99c7ff' },
  { tag: [tags.propertyName, tags.attributeName, tags.function(tags.variableName), tags.link], color: '#91dfd4' },
  { tag: [tags.regexp, tags.escape], color: '#f4cb7c' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
]);

export const languageHighlighting = syntaxHighlighting(editorHighlightStyle);
