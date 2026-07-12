/**
 * theme.ts
 * ─────────────────────────────────────────────
 * All visual design tokens (colors, radii, shadows) live here.
 *
 * WHY a separate file?
 * If the design team wants to change the app's primary green,
 * you change ONE line here and it updates everywhere automatically.
 * No hunting through 10 different component files.
 */

export const THEME = {
  // ── Background layers (darkest → lightest) ──────────────────────────────
  bg:          "#0F1F17",   // page/screen background
  bgCard:      "#162B1E",   // card surface
  bgElevated:  "#1C3527",   // slightly raised surface (modals, inputs)

  // ── Brand colors ─────────────────────────────────────────────────────────
  primary:     "#3DDC84",   // bright green — buttons, active states
  primaryDim:  "#2AAF63",   // darker green — pressed states
  primaryGlow: "#3DDC8430", // green with low opacity — glow effects

  // ── Accent ───────────────────────────────────────────────────────────────
  accent:    "#FFD166",     // gold/yellow — highlights
  accentDim: "#FFD16620",   // gold with low opacity

  // ── Text hierarchy (brightest → most muted) ───────────────────────────────
  textWhite: "#F0FFF6",     // headings, primary text
  textMid:   "#A8C5B0",     // secondary text
  textMuted: "#5A7A65",     // placeholders, labels
  textDim:   "#3d6b50",     // very quiet text (inactive nav labels)

  // ── Borders ───────────────────────────────────────────────────────────────
  border:       "#243D2C",  // default border
  borderBright: "#2E5438",  // slightly brighter border (inputs, cards)

  // ── Navigation bar ────────────────────────────────────────────────────────
  navBg:     "#111e17",
  navBorder: "#1e3828",

  // ── Folder accent color palette ───────────────────────────────────────────
  // These are the colors a user can pick when creating a folder.
  folderBlue:   "#4A90D9",
  folderGreen:  "#3DDC84",
  folderRed:    "#E05C7A",
  folderGold:   "#FFD166",
  folderPurple: "#A78BFA",
  folderOrange: "#FB923C",
  folderPink:   "#F472B6",
  folderCyan:   "#22D3EE",

  // ── Border radii ──────────────────────────────────────────────────────────
  radiusSm:   10,
  radiusMd:   16,
  radiusLg:   22,
  radiusFull: 999,  // pill shape

  // ── Shadows ───────────────────────────────────────────────────────────────
  cardShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,  // Android shadow
  },
  glowShadow: {
    shadowColor: "#3DDC84",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;