import { darkTheme, lightTheme, resolveTheme, type ThemePreference } from '../src/theme';

const relativeLuminance = (hex: string): number => {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
};

const contrast = (foreground: string, background: string): number => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

describe('theme tokens', () => {
  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ] as const)('%s body text meets WCAG AA on canvas and surfaces', (_name, theme) => {
    expect(contrast(theme.colors.text, theme.colors.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.colors.text, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.colors.textMuted, theme.colors.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.colors.onPrimary, theme.colors.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps food artwork colors identical between themes', () => {
    expect(darkTheme.foodPalette).toEqual(lightTheme.foodPalette);
  });

  it.each([
    ['system', 'dark', 'dark'],
    ['system', null, 'light'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
  ] as Array<[ThemePreference, 'light' | 'dark' | null, 'light' | 'dark']>)(
    'resolves %s preference with %s system mode',
    (preference, systemMode, expected) => {
      expect(resolveTheme(preference, systemMode).mode).toBe(expected);
    },
  );
});
