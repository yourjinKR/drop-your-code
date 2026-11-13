export const snapshotFonts = {
  default: { label: 'System monospace', family: 'Consolas, "SFMono-Regular", Menlo, monospace' },
  consolas: { label: 'Consolas', family: 'Consolas, monospace' },
  courier: { label: 'Courier New', family: '"Courier New", monospace' },
  menlo: { label: 'Menlo', family: 'Menlo, monospace' },
} as const;

export const snapshotShadows = {
  low: { offsetY: 8, blur: 6, opacity: 0.16 },
  medium: { offsetY: 16, blur: 12, opacity: 0.2 },
  high: { offsetY: 22, blur: 18, opacity: 0.32 },
} as const;

export const presentationRanges = {
  radius: { min: 0, max: 32, step: 1 },
  backgroundPadding: { min: 0, max: 128, step: 1 },
  fontSize: { min: 10, max: 32, step: 1 },
  lineHeight: { min: 1.2, max: 2, step: 0.1 },
  codePadding: { min: 0, max: 64, step: 1 },
} as const;

export type PresentationNumber = keyof typeof presentationRanges;
export type FontId = keyof typeof snapshotFonts;
export type ShadowStrength = keyof typeof snapshotShadows;
export type SnapshotPresentation = Readonly<Record<PresentationNumber, number> & {
  title: string;
  showLanguageIcon: boolean;
  shadowEnabled: boolean;
  shadowStrength: ShadowStrength;
  backgroundColor: string;
  transparent: boolean;
  fontId: FontId;
}>;

export const defaultSnapshotPresentation: SnapshotPresentation = Object.freeze({
  title: 'untitled',
  showLanguageIcon: true,
  radius: 12,
  shadowEnabled: true,
  shadowStrength: 'medium',
  backgroundColor: '#242427',
  backgroundPadding: 48,
  transparent: false,
  fontId: 'default',
  fontSize: 14,
  lineHeight: 1.5,
  codePadding: 24,
});

export const titleFont = '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
export const windowHeaderHeight = 44;
export const snapshotTabSize = 2;

export function validPresentationNumber(key: PresentationNumber, value: number) {
  const { min, max, step } = presentationRanges[key];
  const steps = value / step;
  return Number.isFinite(value) && value >= min && value <= max && Math.abs(steps - Math.round(steps)) < 1e-8;
}

export function validPresentation(value: SnapshotPresentation) {
  return typeof value.title === 'string'
    && typeof value.showLanguageIcon === 'boolean'
    && typeof value.shadowEnabled === 'boolean'
    && typeof value.transparent === 'boolean'
    && Object.hasOwn(snapshotShadows, value.shadowStrength)
    && Object.hasOwn(snapshotFonts, value.fontId)
    && typeof value.backgroundColor === 'string' && /^#[0-9a-f]{6}$/i.test(value.backgroundColor)
    && (Object.keys(presentationRanges) as PresentationNumber[]).every((key) => validPresentationNumber(key, value[key]));
}
