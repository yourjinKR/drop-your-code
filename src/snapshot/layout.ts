import type { SnapshotInput } from '../state/workspace';
import { getBasicTheme } from '../theme/basicThemes';
import type { SyntaxStyle } from '../theme/syntaxHighlighting';
import type { HighlightSpan } from './highlight';
import type { MeasureText } from './measureText';
import { snapshotFonts, snapshotShadows, snapshotTabSize, windowHeaderHeight } from './presentation';

export type SnapshotRun = Readonly<{ text: string; x: number; width: number; style?: SyntaxStyle | undefined }>;
export type SnapshotRow = Readonly<{
  lineNumber: number;
  continuation: boolean;
  baseline: number;
  runs: readonly SnapshotRun[];
}>;

type CodePiece = { text: string; style?: SyntaxStyle | undefined };

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

function placeLine(pieces: CodePiece[], measure: MeasureText, limit = Infinity): SnapshotRun[][] {
  const rows: SnapshotRun[][] = [[]];
  const tab = snapshotTabSize * measure(' ');
  let x = 0;
  function nextRow() {
    rows.push([]);
    x = 0;
  }
  function append(text: string, width: number, style?: SyntaxStyle) {
    rows.at(-1)!.push({ text, x, width, style });
    x += width;
  }
  for (const { text, style } of pieces) {
    for (const part of text.split(/(\t)/)) {
      if (!part) continue;
      if (part === '\t') {
        if (x > 0 && x + (tab - x % tab) > limit) nextRow();
        append(part, tab - x % tab, style);
        continue;
      }
      const width = measure(part, style);
      if (width <= limit - x) {
        append(part, width, style);
        continue;
      }
      const starts = [...Array.from(graphemes.segment(part), ({ index }) => index), part.length];
      let start = 0;
      while (start < starts.length - 1) {
        const fitted = fitGraphemes(part, starts, start, limit - x, measure, style);
        if (fitted === start && x > 0) {
          nextRow();
          continue;
        }
        // Keep an over-wide grapheme intact even if it alone exceeds the available width.
        const end = Math.max(fitted, start + 1);
        const chunk = part.slice(starts[start], starts[end]);
        append(chunk, measure(chunk, style), style);
        start = end;
        if (start < starts.length - 1) nextRow();
      }
    }
  }
  return rows;
}

export function layoutSnapshot(
  input: SnapshotInput,
  highlights: readonly HighlightSpan[],
  measure: MeasureText,
  baselineOffset = input.presentation.fontSize * 1.15,
  measureTitle: MeasureText = measure,
) {
  const presentation = input.presentation;
  const lines = input.code.split(/\r\n?|\n/);
  const lineHeight = presentation.fontSize * presentation.lineHeight;
  const gutter = input.lineNumbers ? Math.ceil(measure('9'.repeat(String(lines.length).length))) + 25 : 0;
  const left = 1 + gutter + presentation.codePadding;
  const fixedWidth = left + presentation.codePadding + 1;
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
    const unwrapped = placeLine(pieces, measure)[0]!;
    const last = unwrapped.at(-1);
    const width = last ? last.x + last.width : 0;
    longest = Math.max(longest, width);
    return { pieces, unwrapped, width };
  });
  const windowWidth = Math.min(960, Math.max(320, Math.ceil(longest + fixedWidth)));
  const availableWidth = windowWidth - fixedWidth;
  const rows: SnapshotRow[] = [];
  laidOut.forEach(({ pieces, unwrapped, width }, index) => {
    const wrapped = width > availableWidth ? placeLine(pieces, measure, availableWidth) : [unwrapped];
    wrapped.forEach((runs, row) => rows.push({
      lineNumber: index + 1,
      continuation: row > 0,
      baseline: 1 + windowHeaderHeight + presentation.codePadding + baselineOffset + rows.length * lineHeight,
      runs: runs.map((run) => ({ ...run, x: run.x + left })),
    }));
  });
  const contentHeight = (count: number) => Math.ceil(2 * presentation.codePadding + count * lineHeight);
  const windowHeight = 2 + windowHeaderHeight + contentHeight(rows.length);
  const shadow = snapshotShadows[presentation.shadowStrength];
  // Keep the portion of the blur visible at 8-bit alpha even with zero background padding.
  const shadowInset = presentation.shadowEnabled ? Math.ceil(2.5 * shadow.blur) : 0;
  const insetX = Math.max(presentation.backgroundPadding, shadowInset);
  const insetTop = Math.max(presentation.backgroundPadding, shadowInset - shadow.offsetY);
  const insetBottom = Math.max(presentation.backgroundPadding, shadowInset + (presentation.shadowEnabled ? shadow.offsetY : 0));
  const titleLimit = (windowWidth - 34) / 2 - (presentation.showLanguageIcon ? 48 : 0);
  const title = presentation.title;
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
    editorContentHeight: contentHeight(input.wrap ? rows.length : lines.length),
    hasOverflowWrap: !input.wrap && rows.length > lines.length,
    languageId: input.languageId,
    theme: getBasicTheme(input.themeId),
    presentation,
    fontFamily: snapshotFonts[presentation.fontId].family,
    shadow,
    displayTitle,
    titleWidth: measureTitle(displayTitle),
  } as const;
}

export type SnapshotModel = ReturnType<typeof layoutSnapshot>;
