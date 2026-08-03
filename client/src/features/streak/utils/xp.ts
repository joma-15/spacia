// ============================================================================
// Spacia — XP Rules
// Central place defining how many XP points each action is worth, so the
// value is never duplicated (or guessed) across the app.
// ============================================================================

export const XP_RULES = {
  REVIEW_CARD: 2,
  UNDERSTAND_CARD: 5,
  COMPLETE_CHALLENGE: 100,
  MAINTAIN_STREAK: 20,
} as const;

export function xpForReviewedCards(cardCount: number): number {
  return cardCount * XP_RULES.REVIEW_CARD;
}

export function xpForUnderstoodCards(cardCount: number): number {
  return cardCount * XP_RULES.UNDERSTAND_CARD;
}

export function formatXP(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${xp}`;
}
