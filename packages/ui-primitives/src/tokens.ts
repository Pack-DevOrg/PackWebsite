/**
 * PackApp design tokens (packapp-design-tokens).
 * Hex, spacing, type, and radius values from PackApp src/themes/theme.ts.
 */
export const tokens = Object.freeze({
  colors: Object.freeze({
    primary: '#F0C62D',
    primaryDark: '#D6B025',
    primaryLight: '#F7D968',
    accent: '#F0C62D',
    black: '#000000',
    darkGray1: '#121212',
    darkGray2: '#1E1E1E',
    darkGray3: '#2C2C2C',
    gray: '#474747',
    textOnPrimary: '#000000',
    buttonPrimaryText: '#000000',
    textPrimary: '#FFFFFF',
    textSecondary: '#909090',
    textTertiary: '#AEAEAE',
    success: '#4CAF50',
    successDark: '#3D9140',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(255, 255, 255, 0.2)',
    borderLight: '#2C2C2C',
    overlay70: 'rgba(0, 0, 0, 0.7)',
    backgroundTransparent: 'rgba(255, 255, 255, 0.05)',
    backgroundLight: 'rgba(255, 255, 255, 0.08)',
    backgroundMedium: 'rgba(255, 255, 255, 0.12)',
    googleBackground: '#FFFFFF',
    googleText: '#3C4043',
    appleBackground: '#000000',
    appleText: '#FFFFFF',
  }),
  spacing: Object.freeze({
    xs: 4,
    s: 8,
    s12: 12,
    m: 16,
    l: 24,
    xl: 32,
  }),
  borderRadius: Object.freeze({
    m: 8,
    r10: 10,
    l: 12,
    r16: 16,
    r20: 20,
    xl: 24,
    r28: 28,
  }),
  typography: Object.freeze({
    fontSize: Object.freeze({
      xs: 12,
      s: 14,
      m: 16,
      m15: 15,
      l: 18,
      xl: 20,
      xxxl32: 32,
      hero44: 44,
    }),
    lineHeight: Object.freeze({
      title: 40,
      hero: 50,
      subtitle: 24,
    }),
    fontWeight: Object.freeze({
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    }),
  }),
  buttonHeightL: 55,
});

export type PackAppTokens = typeof tokens;
