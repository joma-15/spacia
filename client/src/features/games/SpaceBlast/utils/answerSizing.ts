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

export const MIN_FONT_SIZE = 11;
export const BASE_FONT_SIZE = 14;

/** The on-screen diameter a bubble will render at for a given label. */
export interface BubbleDimensions {
  width: number;
  height: number;
  fontSize: number;
}

/** A conservative text measurement shared by spawning and rendering. */
export function getBubbleDimensions(label: string, playAreaWidth: number): BubbleDimensions {
  const width = Math.max(104, Math.min(190, Math.max(104, playAreaWidth - 28)));
  const fontSize = label.length > 90 ? MIN_FONT_SIZE : BASE_FONT_SIZE;
  const charsPerLine = Math.max(8, Math.floor((width - 28) / (fontSize * 0.62)));
  const lines = Math.max(1, Math.ceil(label.length / charsPerLine));
  return { width: Math.round(width), height: Math.round(32 + lines * (fontSize * 1.3)), fontSize };
}
