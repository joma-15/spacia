/**
 * Text-driven sizing math shared between the visual bubble
 * (AnswerBubble) and the spawn/positioning logic (spawnAnswer).
 *
 * Kept in ONE place on purpose: if the bubble visually grows
 * differently than the spawn logic assumes it will, spawn positions
 * that were "safe" on paper stop being safe on screen, and bubbles in
 * neighboring lanes can end up overlapping. Both files must always
 * agree on how big a label makes a bubble.
 */

export const MIN_GROWTH_LEN = 6; // labels shorter than this don't grow the bubble
export const GROWTH_PER_CHAR = 3.2; // px of extra diameter per character over MIN_GROWTH_LEN
export const MAX_GROWTH_FACTOR = 1.4; // never grow past this multiple of the base size
export const MIN_FONT_SIZE = 9;
export const BASE_FONT_SIZE = 12;

/** The on-screen diameter a bubble will render at for a given label. */
export function estimateDisplaySize(baseSize: number, label: string): number {
  const extraChars = Math.max(0, label.length - MIN_GROWTH_LEN);
  const grown = baseSize + extraChars * GROWTH_PER_CHAR;
  return Math.round(Math.min(grown, baseSize * MAX_GROWTH_FACTOR));
}

/** The font size a bubble will render its label at. */
export function estimateFontSize(label: string): number {
  const extraChars = Math.max(0, label.length - MIN_GROWTH_LEN);
  const fontScale = Math.max(MIN_FONT_SIZE / BASE_FONT_SIZE, 1 - extraChars * 0.015);
  return Math.round(BASE_FONT_SIZE * fontScale);
}