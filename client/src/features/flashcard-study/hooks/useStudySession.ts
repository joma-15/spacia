/**
 * useStudySession.ts
 * ─────────────────────────────────────────────
 * Manages the study session itself: which card we're on,
 * how many were marked "Review" vs "Understood", and
 * what happens when the deck is finished.
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

export function useStudySession({ cards, onComplete, resetFlip }: Params) {

  // ── State ────────────────────────────────────────────────────────────────

  /** Index of the card currently being shown */
  const [index, setIndex] = useState(0);

  /** How many cards the user marked "Review" this session */
  const [reviewCount, setReviewCount] = useState(0);

  /** How many cards the user marked "Understood" this session */
  const [understoodCount, setUnderstoodCount] = useState(0);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentCard = cards[index];
  const isLastCard  = index === cards.length - 1;

  /** Percentage of the deck completed so far, used for the progress bar */
  const progressPercent = ((index + 1) / cards.length) * 100;

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Move to the next card, or — if this was the last card —
   * show a summary alert and call onComplete.
   */
  const goToNextCard = (): void => {
    if (isLastCard) {
      Alert.alert(
        "Deck complete 🎉",
        `Understood: ${understoodCount}  •  To review: ${reviewCount}`,
        [{ text: "OK", onPress: onComplete }]
      );
      return;
    }
    setIndex((prev) => prev + 1);
    resetFlip();
  };

  /**
   * Mark the current card as needing review, then advance.
   * Guarded so this can't fire before the user has seen the answer.
   */
  const markForReview = (isFlipped: boolean): void => {
    if (!isFlipped) return;
    setReviewCount((count) => count + 1);
    goToNextCard();
  };

  /**
   * Mark the current card as understood, then advance.
   * Guarded so this can't fire before the user has seen the answer.
   */
  const markAsUnderstood = (isFlipped: boolean): void => {
    if (!isFlipped) return;
    setUnderstoodCount((count) => count + 1);
    goToNextCard();
  };

  return {
    index,
    currentCard,
    reviewCount,
    understoodCount,
    progressPercent,
    totalCards: cards.length,
    markForReview,
    markAsUnderstood,
  };
}