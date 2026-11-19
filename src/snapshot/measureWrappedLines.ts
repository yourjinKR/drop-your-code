import type { CodePiece } from './layout';
import type { SnapshotPresentation } from './presentation';
import { snapshotFonts, snapshotTabSize } from './presentation';
import { xmlText } from './xmlText';

export function measureWrappedLines(lines: readonly (readonly CodePiece[])[], width: number, presentation: SnapshotPresentation) {
  const container = document.createElement('div');
  const lineHeight = presentation.fontSize * presentation.lineHeight;
  Object.assign(container.style, {
    position: 'fixed', top: '0', left: '0', visibility: 'hidden', pointerEvents: 'none',
    contain: 'layout style paint', width: `${width}px`, direction: 'ltr',
    fontFamily: snapshotFonts[presentation.fontId].family, fontSize: `${presentation.fontSize}px`,
    fontVariantLigatures: 'none', lineHeight: `${lineHeight}px`, tabSize: String(snapshotTabSize),
    // Match CodeMirror's lineWrapping so word boundaries and whitespace break in the same places.
    whiteSpace: 'break-spaces', wordBreak: 'break-word', overflowWrap: 'anywhere',
  });
  const rendered = lines.map((pieces) => {
    const line = document.createElement('div');
    const nodes = pieces.map(({ text, style }) => {
      const node = document.createTextNode(xmlText(text));
      if (!style?.fontStyle && !style?.fontWeight) {
        line.append(node);
        return node;
      }
      const run = document.createElement('span');
      if (style?.fontStyle) run.style.fontStyle = style.fontStyle;
      if (style?.fontWeight) run.style.fontWeight = style.fontWeight;
      run.append(node);
      line.append(run);
      return node;
    });
    container.append(line);
    return { line, nodes };
  });
  document.body.append(container);
  try {
    const range = document.createRange();
    return rendered.map(({ line, nodes }) => {
      const top = line.getBoundingClientRect().top;
      const breaks: number[] = [];
      let offset = 0;
      let previousRow = 0;
      for (const node of nodes) {
        const rowAt = (index: number) => {
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const rect = range.getBoundingClientRect();
          return Math.floor((rect.top + rect.height / 2 - top) / lineHeight);
        };
        let start = 0;
        let row = rowAt(start);
        if (row > previousRow) breaks.push(offset);
        const last = node.length - 1;
        const lastRow = rowAt(last);
        // Query only the boundaries of visual rows, even for very long tokens.
        while (row < lastRow) {
          let low = start;
          let high = last;
          while (low + 1 < high) {
            const middle = Math.floor((low + high) / 2);
            if (rowAt(middle) > row) high = middle;
            else low = middle;
          }
          breaks.push(offset + high);
          start = high;
          row = rowAt(start);
        }
        previousRow = lastRow;
        offset += node.length;
      }
      return breaks;
    });
  } finally {
    container.remove();
  }
}
