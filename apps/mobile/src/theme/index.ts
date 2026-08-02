import type { ColorSchemeName, TextStyle, ViewStyle } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const primitives = {
  cream50: '#FFF8EE',
  cream100: '#FFF1DC',
  white: '#FFFFFF',
  ink900: '#0D1730',
  ink800: '#14213D',
  navy700: '#172341',
  navy600: '#203052',
  slate500: '#63708A',
  slate300: '#B5C1D8',
  sand300: '#E6D7C5',
  blueGray600: '#344362',
  coral: '#FF5A47',
  coralDark: '#D83A52',
  teal: '#19B7A5',
  violet: '#6D4AFF',
  gold: '#F7B928',
  sky: '#34B7F1',
  green: '#1FAD78',
} as const;

export const foodPalette = {
  outline: '#17213F',
  leaf: '#58B947',
  leafDark: '#2F8E42',
  red: '#F24F4F',
  orange: '#F79335',
  yellow: '#F7C948',
  purple: '#7D4CB8',
  blue: '#4EA8DE',
  cream: '#FFF2CF',
  brown: '#9A633A',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const typography = {
  display: { fontFamily: 'Rubik_800ExtraBold', fontSize: 36, lineHeight: 42, fontWeight: '800' as const },
  h1: { fontFamily: 'Rubik_800ExtraBold', fontSize: 30, lineHeight: 36, fontWeight: '800' as const },
  h2: { fontFamily: 'Rubik_700Bold', fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  title: { fontFamily: 'Rubik_700Bold', fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontFamily: 'Rubik_400Regular', fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontFamily: 'Rubik_600SemiBold', fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontFamily: 'Rubik_500Medium', fontSize: 12, lineHeight: 18, fontWeight: '500' as const },
} satisfies Record<string, TextStyle>;

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const motion = {
  feedback: 120,
  transition: 220,
  celebration: 420,
} as const;

export type ThemeColors = {
  canvas: string;
  surface: string;
  surfaceAlt: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  progress: string;
  onProgress: string;
  reward: string;
  hydration: string;
  success: string;
  danger: string;
  focus: string;
  overlay: string;
  disabled: string;
  foodTiles: {
    vegetable: string;
    fruit: string;
    protein: string;
    carbohydrate: string;
    fat: string;
    limited: string;
    generic: string;
  };
};

export type AppTheme = {
  mode: ResolvedTheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  motion: typeof motion;
  foodPalette: typeof foodPalette;
  shadow: ViewStyle;
};

const lightColors: ThemeColors = {
  canvas: primitives.cream50,
  surface: primitives.white,
  surfaceAlt: primitives.cream100,
  surfaceRaised: primitives.white,
  text: primitives.ink800,
  textMuted: '#58657D',
  border: primitives.sand300,
  primary: primitives.coral,
  onPrimary: primitives.ink900,
  secondary: primitives.teal,
  onSecondary: primitives.ink900,
  progress: primitives.violet,
  onProgress: primitives.white,
  reward: primitives.gold,
  hydration: primitives.sky,
  success: '#147A58',
  danger: '#C92F49',
  focus: primitives.violet,
  overlay: 'rgba(13, 23, 48, 0.48)',
  disabled: '#C8C0B6',
  foodTiles: {
    vegetable: '#DDF5E5',
    fruit: '#FFE1DF',
    protein: '#DCEEFF',
    carbohydrate: '#FFE8BD',
    fat: '#D9F4EA',
    limited: '#EADDF8',
    generic: '#FFF0C9',
  },
};

const darkColors: ThemeColors = {
  canvas: primitives.ink900,
  surface: primitives.navy700,
  surfaceAlt: primitives.navy600,
  surfaceRaised: '#26385B',
  text: primitives.cream50,
  textMuted: primitives.slate300,
  border: primitives.blueGray600,
  primary: '#FF7463',
  onPrimary: primitives.ink900,
  secondary: '#39CCB9',
  onSecondary: primitives.ink900,
  progress: '#927BFF',
  onProgress: primitives.ink900,
  reward: '#FFD05A',
  hydration: '#64C9F5',
  success: '#51D2A5',
  danger: '#FF8593',
  focus: '#B3A5FF',
  overlay: 'rgba(0, 0, 0, 0.68)',
  disabled: '#53617A',
  foodTiles: {
    vegetable: '#203D38',
    fruit: '#472F3A',
    protein: '#233B55',
    carbohydrate: '#493B27',
    fat: '#203F3B',
    limited: '#3C3152',
    generic: '#463D28',
  },
};

const createTheme = (mode: ResolvedTheme, colors: ThemeColors): AppTheme => ({
  mode,
  colors,
  spacing,
  typography,
  radii,
  motion,
  foodPalette,
  shadow:
    mode === 'light'
      ? {
          shadowColor: primitives.ink900,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 14,
          elevation: 3,
        }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 7 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
          elevation: 4,
        },
});

export const lightTheme = createTheme('light', lightColors);
export const darkTheme = createTheme('dark', darkColors);

export const resolveTheme = (
  preference: ThemePreference,
  systemMode: ColorSchemeName,
): AppTheme => {
  const resolved = preference === 'system' ? (systemMode === 'dark' ? 'dark' : 'light') : preference;
  return resolved === 'dark' ? darkTheme : lightTheme;
};

export type ThemedStyles<T> = (theme: AppTheme) => T;
