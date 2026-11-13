import type { SnapshotModel } from './model';
import { serializeLanguageArtwork } from './languageArtwork';
import { titleFont, windowHeaderHeight } from './presentation';
import { escapeXml } from './xmlText';

const position = (value: number) => Number(value.toFixed(3));

export function renderSnapshotSvg(model: SnapshotModel): string {
  const { window: frame, width, height, theme, presentation, shadow } = model;
  const { radius, backgroundColor, transparent, showLanguageIcon, shadowEnabled, fontSize } = presentation;
  const frameSize = `width="${frame.width}" height="${frame.height}" rx="${radius}"`;
  const rows = model.rows.map(({ lineNumber, continuation, baseline, runs }) => {
    const number = model.gutter && !continuation
      ? `<text x="${model.gutter - 12}" y="${position(baseline)}" text-anchor="end" fill="${theme.muted}">${lineNumber}</text>` : '';
    const code = runs.map(({ text, x, style }) => {
      const color = style?.color ? ` fill="${style.color}"` : '';
      const italic = style?.fontStyle ? ` font-style="${style.fontStyle}"` : '';
      const weight = style?.fontWeight ? ` font-weight="${style.fontWeight}"` : '';
      const decoration = style?.textDecoration ? ` text-decoration="${style.textDecoration}"` : '';
      return `<text x="${position(x)}" y="${position(baseline)}"${color}${italic}${weight}${decoration}>${escapeXml(text)}</text>`;
    }).join('');
    return `<g class="code-row">${number}${code}</g>`;
  }).join('');
  const icon = showLanguageIcon ? `<g class="language-icon" transform="translate(${position(frame.width / 2 - model.titleWidth / 2 - 24)} 15) scale(0.666667)" fill="none" stroke="${theme.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${serializeLanguageArtwork(model.languageId)}</g>` : '';
  const title = `<text x="${frame.width / 2}" y="23" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(titleFont)}" font-size="13" font-weight="600" fill="${theme.muted}">${escapeXml(model.displayTitle)}</text>`;
  const lights = ['#f07168', '#e9bf59', '#76c77a'].map((color, index) =>
    `<circle cx="${22 + 16 * index}" cy="23" r="5" fill="${color}"/>`).join('');
  const shadowFilter = shadowEnabled ? `<filter id="window-shadow" filterUnits="userSpaceOnUse" x="${-frame.x}" y="${-frame.y}" width="${width}" height="${height}"><feGaussianBlur stdDeviation="${shadow.blur}"/></filter>` : '';
  const windowShadow = shadowEnabled ? `<g filter="url(#window-shadow)" opacity="${shadow.opacity}"><rect ${frameSize} y="${shadow.offsetY}" fill="#000"/></g>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xml:space="preserve">
<defs><clipPath id="window-clip"><rect ${frameSize}/></clipPath>${shadowFilter}</defs>
${transparent ? '' : `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`}
<g transform="translate(${frame.x} ${frame.y})">
${windowShadow}
<g clip-path="url(#window-clip)">
<rect ${frameSize} fill="${theme.background}"/>
<rect width="${frame.width}" height="${windowHeaderHeight + 1}" fill="${theme.header}"/>
<path d="M0 ${windowHeaderHeight + 0.5}H${frame.width}" stroke="${theme.border}"/>
${lights}${icon}${title}
${model.gutter ? `<path d="M${model.gutter + 0.5} ${windowHeaderHeight + 1}V${frame.height}" stroke="${theme.border}"/>` : ''}
<g font-family="${escapeXml(model.fontFamily)}" font-size="${fontSize}" fill="${theme.foreground}" style="white-space:pre;font-variant-ligatures:none">${rows}</g>
</g>
<rect x="0.5" y="0.5" width="${frame.width - 1}" height="${frame.height - 1}" rx="${Math.max(0, radius - 0.5)}" fill="none" stroke="${theme.border}"/>
</g></svg>`;
}
