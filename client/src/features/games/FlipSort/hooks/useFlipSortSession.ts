/**
 * useFlipSortSession.ts
 * ─────────────────────────────────────────────
 * Manages the Flip & Sort game session: active card index,
 * counts for "Review" vs "Understood", progress percentage,
 * and completion alerts.
 */

import { useState } from "react";
import { Alert } from "react-native";
import type { Flashcard } from "../types";

interface Params {
  cards: Flashcard[];
  /** Called after the deck-complete alert is dismissed */
  onComplete?: () => void;
  /** Reset the flip animation — passed in from useCardFlip */
  resetFlip: () => void;
}

export function useFlipSortSession({ cards, onComplete, resetFlip }: Params) {
  // ── State ────────────────────────────────────────────────────────────────

  /** Index of the card currently being shown (starts at 0) */
  const [index, setIndex] = useState(0);

  /** How many cards the user marked "Review" (hard cards) */
  const [reviewCount, setReviewCount] = useState(0);

  /** How many cards the user marked "Understood" (easy cards) */
  const [understoodCount, setUnderstoodCount] = useState(0);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentCard = cards[index];
  const isLastCard = index === cards.length - 1;

  /** Percentage of the deck completed so far */
  const progressPercent =
    cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  // ── Actions ───────────────────────────────────────────────────────────────

  const goToNextCard = (): void => {
    if (isLastCard) {
      Alert.alert(
        "Flip & Sort complete 🎉",
        `Understood: ${understoodCount}  •  To review: ${reviewCount}`,
        [{ text: "OK", onPress: onComplete }],
      );
      return;
    }
    setIndex((prev) => prev + 1);
    resetFlip();
  };

  const markForReview = (isFlipped: boolean): void => {
    if (!isFlipped) return; // Cannot score an unflipped card
    setReviewCount((count) => count + 1);
    goToNextCard();
  };

  const markAsUnderstood = (isFlipped: boolean): void => {
    if (!isFlipped) return; // Cannot score an unflipped card
    setUnderstoodCount((count) => count + 1);
    goToNextCard();
  };

  /**
   * Swipe-to-skip: advances to the next card without recording a
   * review/understood outcome. Works regardless of flip state.
   */
  const skipCard = (): void => {
    goToNextCard();
  };
  return {
    index,
    currentCard,
    reviewCount,
    understoodCount,
    progressPercent,
    totalCards: cards.length,
    skipCard,
    markForReview,
    markAsUnderstood,
  };
}
