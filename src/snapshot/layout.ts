import type { SnapshotInput } from '../state/workspace';
import { getBasicTheme } from '../theme/basicThemes';
import type { HighlightSpan, SyntaxStyle } from '../theme/syntaxHighlighting';
import type { MeasureText } from './measureText';
import {
  minSnapshotWindowWidth, snapshotFonts, snapshotInsets, snapshotShadows, snapshotTabSize, windowHeaderHeight, windowHeaderPadding,
} from './presentation';
import { formatWindowTitle } from './windowTitle';

export type SnapshotRun = Readonly<{ text: string; x: number; width: number; style?: SyntaxStyle | undefined }>;
export type SnapshotRow = Readonly<{
  lineNumber: number;
  continuation: boolean;
  baseline: number;
  runs: readonly SnapshotRun[];
}>;

export type CodePiece = Readonly<{ text: string; style?: SyntaxStyle | undefined }>;
export type MeasureWrappedLines = (lines: readonly (readonly CodePiece[])[], width: number) => readonly (readonly number[])[];

type LayoutMeasurement = {
  baselineOffset?: number;
  measureTitle?: MeasureText;
  measureWrap?: MeasureWrappedLines;
};

const maxWrapWindowWidth = 960;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function fitText(text: string, limit: number, measure: MeasureText, style?: SyntaxStyle): number {
  if (measure(text, style) <= limit) return text.length;
  const starts = [...Array.from(graphemes.segment(text), ({ index }) => index), text.length];
  return starts[fitGraphemes(text, starts, 0, limit, measure, style)]!;
}

function fitGraphemes(text: string, starts: number[], start: number, limit: number, measure: MeasureText, style?: SyntaxStyle) {
  const last = starts.length - 1;
  const fits = (end: number) => measure(text.slice(starts[start], starts[end]), style) <= limit;
  let low = start;
  let step = 1;
  let high = Math.min(start + step, last);
  while (fits(high)) {
    if (high === last) return high;
    low = high;
    step *= 2;
    high = Math.min(start + step, last);
  }
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}

function placeLine(pieces: readonly CodePiece[], measure: MeasureText): SnapshotRun[] {
  const runs: SnapshotRun[] = [];
  const tab = snapshotTabSize * measure(' ');
  let x = 0;
  for (const { text, style } of pieces) {
    for (const part of text.split(/(\t)/)) {
      if (!part) continue;
      const width = part === '\t' ? tab - x % tab : measure(part, style);
      runs.push({ text: part, x, width, style });
      x += width;
    }
  }
  return runs;
}

function splitAtBreaks(pieces: CodePiece[], breaks: readonly number[]) {
  const rows: CodePiece[][] = [[]];
  let offset = 0;
  let nextBreak = 0;
  for (const piece of pieces) {
    let start = 0;
    const end = offset + piece.text.length;
    while (nextBreak < breaks.length && breaks[nextBreak]! < end) {
      const split = breaks[nextBreak++]! - offset;
      if (split > start) rows.at(-1)!.push({ ...piece, text: piece.text.slice(start, split) });
      rows.push([]);
      start = split;
    }
    rows.at(-1)!.push({ ...piece, text: piece.text.slice(start) });
    offset = end;
  }
  return rows;
}

export function layoutSnapshot(
  input: SnapshotInput,
  highlights: readonly HighlightSpan[],
  measure: MeasureText,
  { baselineOffset = input.presentation.fontSize * 1.15, measureTitle = measure, measureWrap }: LayoutMeasurement = {},
) {
  const presentation = input.presentation;
  const lines = input.code.split(/\r\n?|\n/);
  const lineHeight = presentation.fontSize * presentation.lineHeight;
  const gutter = input.lineNumbers ? Math.ceil(measure('9'.repeat(String(lines.length).length))) + 25 : 0;
  const left = gutter + presentation.codePadding;
  const fixedWidth = left + presentation.codePadding;
  let offset = 0;
  let tokenIndex = 0;
  let longest = 0;
  const laidOut = lines.map((line) => {
    const end = offset + line.length;
    const pieces: CodePiece[] = [];
    let cursor = offset;
    while (tokenIndex < highlights.length && highlights[tokenIndex]!.to <= offset) tokenIndex++;
    while (cursor < end && tokenIndex < highlights.length) {
      const token = highlights[tokenIndex]!;
      if (token.from >= end) break;
      if (token.from > cursor) pieces.push({ text: line.slice(cursor - offset, token.from - offset) });
      const stop = Math.min(end, token.to);
      pieces.push({ text: line.slice(Math.max(cursor, token.from) - offset, stop - offset), style: token.style });
      cursor = stop;
      if (token.to <= end) tokenIndex++;
    }
    if (cursor < end) pieces.push({ text: line.slice(cursor - offset) });
    offset = end + 1;
    const unwrapped = placeLine(pieces, measure);
    const last = unwrapped.at(-1);
    const width = last ? last.x + last.width : 0;
    longest = Math.max(longest, width);
    return { pieces, unwrapped, width };
  });
  const naturalWidth = Math.max(minSnapshotWindowWidth, Math.ceil(longest + fixedWidth));
  const windowWidth = input.wrap ? Math.min(maxWrapWindowWidth, naturalWidth) : naturalWidth;
  const availableWidth = windowWidth - fixedWidth;
  const overflow = input.wrap ? laidOut.filter(({ width }) => width > availableWidth) : [];
  const breaks = overflow.length ? measureWrap?.(overflow.map(({ pieces }) => pieces), availableWidth) : undefined;
  if (overflow.length && !breaks) throw new Error('Wrapped lines require browser measurements.');
  let wrapIndex = 0;
  const rows: SnapshotRow[] = [];
  laidOut.forEach(({ pieces, unwrapped, width }, index) => {
    const lineBreaks = breaks && width > availableWidth ? breaks[wrapIndex++]! : [];
    const wrapped = lineBreaks.length ? splitAtBreaks(pieces, lineBreaks).map((row) => placeLine(row, measure)) : [unwrapped];
    wrapped.forEach((runs, row) => rows.push({
      lineNumber: index + 1,
      continuation: row > 0,
      baseline: windowHeaderHeight + presentation.codePadding + baselineOffset + rows.length * lineHeight,
      runs: runs.map((run) => ({ ...run, x: run.x + left })),
    }));
  });
  const contentHeight = (count: number) => Math.ceil(2 * presentation.codePadding + count * lineHeight);
  const windowHeight = windowHeaderHeight + contentHeight(rows.length);
  const shadow = snapshotShadows[presentation.shadowStrength];
  const { x: insetX, top: insetTop, bottom: insetBottom } = snapshotInsets(presentation);
  const titleLimit = (windowWidth - 2 * windowHeaderPadding) / 2;
  const title = presentation.showTitle ? formatWindowTitle(presentation.title, input.languageId) : '';
  const displayTitle = measureTitle(title) <= titleLimit ? title
    : `${title.slice(0, fitText(title, titleLimit - measureTitle('…'), measureTitle))}…`;

  return {
    revision: input.revision,
    width: windowWidth + 2 * insetX,
    height: windowHeight + insetTop + insetBottom,
    window: { x: insetX, y: insetTop, width: windowWidth, height: windowHeight },
    rows,
    gutter,
    lineHeight,
    editorContentHeight: contentHeight(rows.length),
    theme: getBasicTheme(input.themeId),
    presentation,
    fontFamily: snapshotFonts[presentation.fontId].family,
    shadow,
    displayTitle,
  } as const;
}

export type SnapshotModel = ReturnType<typeof layoutSnapshot>;
