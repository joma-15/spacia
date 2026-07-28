// styles/styles.ts
// Shared visual styling rules for the streak-auth module.
// Pulled directly from the existing app (home screen + ComingSoonScreen)
// so the auth UI reads as part of the original product, not a bolt-on.

export const colors = {
  background: '#0D1F17', // app background
  surface: '#132921', // card / input background
  surfaceElevated: '#1A332A', // modal sheet background
  border: 'rgba(255,255,255,0.08)',
  borderFocused: 'rgba(52, 211, 153, 0.55)',

  accent: '#34D399', // primary green accent (streak flame, CTA)
  accentMuted: 'rgba(52, 211, 153, 0.12)',
  accentBorder: 'rgba(52, 211, 153, 0.35)',

  danger: '#F87171',
  dangerMuted: 'rgba(248, 113, 113, 0.12)',

  textPrimary: '#FFFFFF',
  textSecondary: '#9CA8A2',
  textTertiary: '#6B7A73',
  overlay: 'rgba(5, 12, 9, 0.72)',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '800' as const },
  subtitle: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  button: { fontSize: 16, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};
