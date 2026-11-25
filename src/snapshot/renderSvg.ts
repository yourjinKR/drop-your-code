import type { SnapshotModel } from './model';
import { titleFont, windowHeaderHeight, windowHeaderPadding, windowLights } from './presentation';
import { escapeXml } from './xmlText';

const position = (value: number) => Number(value.toFixed(3));

export function renderSnapshotSvg(model: SnapshotModel, viewport = { width: model.width, height: model.height }): string {
  const { window: frame, width, height, theme, presentation, shadow } = model;
  const { radius, backgroundColor, transparent, shadowEnabled, fontSize } = presentation;
  const frameSize = `width="${frame.width}" height="${frame.height}" rx="${radius}"`;
  const rows = model.rows.map(({ lineNumber, continuation, baseline, runs }) => {
    const number = model.gutter && !continuation
      ? `<text x="${model.gutter - 13}" y="${position(baseline)}" text-anchor="end" fill="${theme.muted}">${lineNumber}</text>` : '';
    const code = runs.map(({ text, x, style }) => {
      const color = style?.color ? ` fill="${style.color}"` : '';
      const italic = style?.fontStyle ? ` font-style="${style.fontStyle}"` : '';
      const weight = style?.fontWeight ? ` font-weight="${style.fontWeight}"` : '';
      const decoration = style?.textDecoration ? ` text-decoration="${style.textDecoration}"` : '';
      // Apply whitespace preservation directly to each run for SVG image rendering.
      return `<text x="${position(x)}" y="${position(baseline)}" style="white-space:pre"${color}${italic}${weight}${decoration}>${escapeXml(text)}</text>`;
    }).join('');
    return `<g class="code-row">${number}${code}</g>`;
  }).join('');
  const headerCenter = windowHeaderHeight / 2;
  const title = model.displayTitle ? `<text class="window-title" x="${frame.width / 2}" y="${headerCenter}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(titleFont)}" font-size="13" font-weight="600" fill="${theme.muted}">${escapeXml(model.displayTitle)}</text>` : '';
  const { colors, diameter, gap } = windowLights;
  const lights = colors.map((color, index) =>
    `<circle cx="${windowHeaderPadding + diameter / 2 + index * (diameter + gap)}" cy="${headerCenter}" r="${diameter / 2}" fill="${color}"/>`).join('');
  const shadowFilter = shadowEnabled ? `<filter id="window-shadow" filterUnits="userSpaceOnUse" x="${-frame.x}" y="${-frame.y}" width="${width}" height="${height}"><feGaussianBlur stdDeviation="${shadow.blur}"/></filter>` : '';
  const windowShadow = shadowEnabled ? `<g filter="url(#window-shadow)" opacity="${shadow.opacity}"><rect ${frameSize} y="${shadow.offsetY}" fill="#000"/></g>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewport.width}" height="${viewport.height}" viewBox="0 0 ${width} ${height}" xml:space="preserve">
<defs><clipPath id="window-clip"><rect ${frameSize}/></clipPath>${shadowFilter}</defs>
${transparent ? '' : `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`}
<g transform="translate(${frame.x} ${frame.y})">
${windowShadow}
<g clip-path="url(#window-clip)">
<rect ${frameSize} fill="${theme.background}"/>
<rect width="${frame.width}" height="${windowHeaderHeight}" fill="${theme.header}"/>
${lights}${title}
${model.gutter ? `<path d="M${model.gutter - 0.5} ${windowHeaderHeight}V${frame.height}" stroke="${theme.border}"/>` : ''}
<g font-family="${escapeXml(model.fontFamily)}" font-size="${fontSize}" fill="${theme.foreground}" style="font-variant-ligatures:none">${rows}</g>
</g>
</g></svg>`;
}
