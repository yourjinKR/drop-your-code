export const defaultSnapshotPresentation = Object.freeze({
  title: 'untitled',
  showLanguageIcon: true,
  radius: 12,
  shadowEnabled: true,
  shadowStrength: 'medium' as const,
  backgroundColor: '#242427',
  backgroundPadding: 48,
  transparent: false,
  fontId: 'default' as const,
  fontSize: 14,
  lineHeight: 1.5,
  codePadding: 24,
});

export const snapshotFont = 'Consolas, "SFMono-Regular", Menlo, monospace';
export const titleFont = '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
export const windowHeaderHeight = 44;
export const snapshotTabSize = 2;
export const snapshotShadow = { offsetY: 16, blur: 12, opacity: 0.2 };
