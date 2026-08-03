// ============================================================================
// Spacia — Theme Tokens
// Dark, premium, green-accented palette. All components pull colors/spacing
// from here — no hardcoded hex values inside components.
// ============================================================================

export const colors = {
  // Backgrounds
  background: "#0A1410",
  backgroundElevated: "#0F1B16",
  surface: "#132119",
  surfaceElevated: "#1A2A21",
  surfaceHighlight: "#213328",

  // Borders / dividers
  border: "#1E2E25",
  borderLight: "#2A3D31",

  // Brand green accents
  primary: "#34D399",
  primaryDark: "#10B981",
  primaryMuted: "#1F4A38",
  primarySoft: "rgba(52, 211, 153, 0.12)",

  // Secondary accent (mint / lime for highlights)
  accent: "#A7F3D0",

  // Text
  textPrimary: "#F4FBF7",
  textSecondary: "#9AB0A3",
  textTertiary: "#647A6E",
  textInverse: "#06120C",

  // Status colors
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  info: "#60A5FA",

  // Calendar status colors
  calendarCompleted: "#34D399",
  calendarMissed: "#3A2A2A",
  calendarToday: "#FBBF24",
  calendarFuture: "#16221C",

  // Misc
  streakFlame: "#FB923C",
  xpGold: "#FBBF24",
  overlay: "rgba(6, 18, 12, 0.6)",
  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 30,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
  },
};

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
};
