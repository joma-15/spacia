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

  /** Index of the card currently being shown (starts at 0 for the first card) */
  const [index, setIndex] = useState(0);

  /** How many cards the user marked "Review" (hard cards) during this study session */
  const [reviewCount, setReviewCount] = useState(0);

  /** How many cards the user marked "Understood" (easy cards) during this study session */
  const [understoodCount, setUnderstoodCount] = useState(0);

  // ── Derived values ────────────────────────────────────────────────────────

  // We compute these automatically based on the current index and state changes.
  const currentCard = cards[index];
  const isLastCard  = index === cards.length - 1;

  /** Percentage of the deck completed so far, used to draw the progress bar indicator */
  const progressPercent = ((index + 1) / cards.length) * 100;

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Moves the user to the next card, or — if this was the last card in the deck —
   * displays a congratulatory modal pop-up showing their scores, and executes 
   * the 'onComplete' function.
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
    // Move index up by 1, and reset the 3D flip card animation back to the front side
    setIndex((prev) => prev + 1);
    resetFlip();
  };

  /**
   * Mark the current card as needing review (hard), then advance.
   * Safety check: prevents the user from clicking the button before they have flipped 
   * the card to read the answer!
   */
  const markForReview = (isFlipped: boolean): void => {
    if (!isFlipped) return; // Cannot score an unflipped card
    setReviewCount((count) => count + 1);
    goToNextCard();
  };

  /**
   * Mark the current card as understood (easy), then advance.
   * Safety check: prevents the user from clicking the button before they have flipped 
   * the card to read the answer!
   */
  const markAsUnderstood = (isFlipped: boolean): void => {
    if (!isFlipped) return; // Cannot score an unflipped card
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