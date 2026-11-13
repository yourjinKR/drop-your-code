import type { SyntaxStyle } from '../theme/syntaxHighlighting';
import { titleFont } from './presentation';
import { xmlText } from './xmlText';

export type MeasureText = (text: string, style?: SyntaxStyle) => number;

export async function prepareTextMeasurement(family: string, size: number, lineHeight: number) {
  const font = `${size}px ${family}`;
  const heading = `600 13px ${titleFont}`;
  const fonts = document.fonts;
  if (fonts) {
    await Promise.all([fonts.load(font), fonts.load(`italic bold ${font}`), fonts.load(heading)]);
  }

  const context = typeof CanvasRenderingContext2D === 'undefined'
    ? null : document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('Snapshot font measurement is unavailable');
  context.font = font;
  const metrics = context.measureText('Mg');
  const ascent = metrics.fontBoundingBoxAscent ?? size * 0.8;
  const descent = metrics.fontBoundingBoxDescent ?? size * 0.2;
  const cache = new Map<string, number>();
  const measure: MeasureText = (text, style) => {
    const face = `${style?.fontStyle ?? 'normal'} ${style?.fontWeight ?? 'normal'} ${font}`;
    const key = `${face}\n${text}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    if (context.font !== face) context.font = face;
    const width = context.measureText(xmlText(text)).width;
    cache.set(key, width);
    return width;
  };
  const measureTitle: MeasureText = (text) => {
    context.font = heading;
    return context.measureText(xmlText(text)).width;
  };
  return { measure, measureTitle, baseline: (lineHeight + ascent - descent) / 2 };
}
