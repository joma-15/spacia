/**
 * colors.ts
 * ─────────────────────────────────────────────
 * Every color token used across the Payment feature.
 *
 * WHY a separate file?
 * Change one value here and it updates everywhere automatically.
 * No need to hunt through multiple component files.
 */

export const COLORS = {
  // ── Backgrounds (darkest → lightest) ──────────────────────────────────
  bg:            "#0f1f18",   // screen background
  surface:       "#172a1f",   // card / section surface
  card:          "#1c3127",   // plan card background
  cardHighlight: "#1f3a2c",   // selected plan card background

  // ── Borders ────────────────────────────────────────────────────────────
  border:     "#2a4a38",      // default border
  borderGlow: "#3d7a57",      // glowing/highlighted border

  // ── Brand green ────────────────────────────────────────────────────────
  accent:     "#4ade80",      // primary green — buttons, active states
  accentDim:  "#2d6b47",      // darker green — pressed / dimmed states
  accentText: "#6ee7a0",      // lighter green — text on dark bg

  // ── Gold ───────────────────────────────────────────────────────────────
  gold:    "#f59e0b",         // gold — premium badge
  goldDim: "#78350f",         // dark gold background

  // ── Text hierarchy (brightest → most muted) ────────────────────────────
  text:     "#e8f5ee",        // headings, primary text
  textMuted: "#6b9a7c",       // secondary text, descriptions
  textDim:  "#3d6b50",        // very quiet text (footer, legal)

  // ── Navigation bar ─────────────────────────────────────────────────────
  navBg:     "#111e17",
  navBorder: "#1e3828",

  white: "#ffffff",
} as const;