/**
 * colors.ts
 * ─────────────────────────────────────────────
 * Every color token used in the flashcard study screen.
 *
 * Change a value here and it updates everywhere automatically —
 * no hunting through multiple component files.
 */

export const COLORS = {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  screenBg:    "#0E1F17",  // full screen background
  exitButtonBg: "#1B2F24", // circular ✕ button background
  trackBg:     "#1B2F24",  // progress bar empty track

  // ── Card faces ────────────────────────────────────────────────────────────
  cardFrontBg:     "#16291F",
  cardFrontBorder: "#27402F",
  cardBackBg:      "#142A20",
  cardBackBorder:  "#1F7A4B",

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: "#F4F7F4",  // main card text, exit icon
  textMuted:   "#8FA396",  // progress counter, empty state
  textDim:     "#5E7468",  // labels, tap hints

  // ── Brand green ───────────────────────────────────────────────────────────
  primary: "#34D17B",      // progress fill, "ANSWER" label, understood border

  // ── Action buttons ────────────────────────────────────────────────────────
  reviewBg:     "#3A2A14",
  reviewBorder: "#6B4A1E",
  reviewText:   "#F0A93B",

  understoodBg:     "#1F7A4B",
  understoodBorder: "#34D17B",
  understoodText:   "#FFFFFF",
} as const;