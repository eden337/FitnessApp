export const colors = {
  background: '#0B1020',
  surface: '#161C33',
  text: '#F4F5FB',
  muted: '#9AA3C7',
  primary: '#FF6A3D',
  accent: '#4DD4AC',
  danger: '#FF5A5F',
  success: '#4DD4AC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const radii = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
