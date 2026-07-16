/**
 * useFlipSortSession.ts
 * ─────────────────────────────────────────────
 * Manages the Flip & Sort game session: active card index,
 * counts for "Review" vs "Understood", progress percentage,
 * and completion alerts.
 */

import { useRef, useState } from "react";
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

  /**
   * Guards against the completion alert firing more than once when
   * goToNextCard() is triggered in quick succession on the last card
   * (e.g. a fast double-swipe before React re-renders).
   */
  const hasCompletedRef = useRef(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentCard = cards[index];

  /** Percentage of the deck completed so far */
  const progressPercent =
    cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  // ── Actions ───────────────────────────────────────────────────────────────

  const goToNextCard = (): void => {
    // Functional update: always reads the *latest* committed index,
    // so two rapid calls (e.g. two fast swipes) can never both think
    // they're "not yet at the last card" and overshoot the array.
    setIndex((prev) => {
      const next = prev + 1;

      if (next >= cards.length) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          Alert.alert(
            "Flip & Sort complete 🎉",
            `Understood: ${understoodCount}  •  To review: ${reviewCount}`,
            [{ text: "OK", onPress: onComplete }]
          );
        }
        return prev; // never advance past the last card
      }

      return next;
    });
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

  /**
   * Swipe-left: goes back to the previous card. Does not undo any
   * review/understood count already recorded — it only moves the index.
   * Clamped so it can never go below the first card.
   */
  const goToPreviousCard = (): void => {
    setIndex((prev) => Math.max(prev -1,0)); 
    resetFlip();
  }

  return {
    index,
    currentCard,
    reviewCount,
    understoodCount,
    progressPercent,
    totalCards: cards.length,
    markForReview,
    markAsUnderstood,
    skipCard,
    goToPreviousCard,
  };
}