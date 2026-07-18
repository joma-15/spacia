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
  onUpdateCardStatus: (cardId: string, status: "review" | "understood") => void;
  /** Called after the deck-complete alert is dismissed */
  onComplete?: () => void;
  /** Reset the flip animation — passed in from useCardFlip */
  resetFlip: () => void;
}

export function useFlipSortSession({ cards, onUpdateCardStatus, onComplete, resetFlip }: Params) {
  // ── State ────────────────────────────────────────────────────────────────

  /** Index of the card currently being shown (starts at 0) */
  const [index, setIndex] = useState(0);

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

  // Dynamic counts derived from the cards state
  const reviewCount = cards.filter((c) => c.status === "review").length;
  const understoodCount = cards.filter((c) => c.status === "understood").length;

  // ── Actions ───────────────────────────────────────────────────────────────

  const goToNextCard = (lastCardStatusChange?: { id: string; status: "review" | "understood" }): void => {
    // Functional update: always reads the *latest* committed index,
    // so two rapid calls (e.g. two fast swipes) can never both think
    // they're "not yet at the last card" and overshoot the array.
    setIndex((prev) => {
      const next = prev + 1;

      if (next >= cards.length) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;

          // Compute final counts dynamically including the status change of the last card
          let uCount = 0;
          let rCount = 0;
          for (const c of cards) {
            const status =
              lastCardStatusChange && c.id === lastCardStatusChange.id
                ? lastCardStatusChange.status
                : c.status;
            if (status === "understood") uCount++;
            if (status === "review") rCount++;
          }

          Alert.alert(
            "Flip & Sort complete 🎉",
            `Understood: ${uCount}  •  To review: ${rCount}`,
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
    if (currentCard) {
      onUpdateCardStatus(currentCard.id, "review");
      goToNextCard({ id: currentCard.id, status: "review" });
    }
  };

  const markAsUnderstood = (isFlipped: boolean): void => {
    if (!isFlipped) return; // Cannot score an unflipped card
    if (currentCard) {
      onUpdateCardStatus(currentCard.id, "understood");
      goToNextCard({ id: currentCard.id, status: "understood" });
    }
  };

  /**
   * Swipe-to-skip: advances to the next card without recording a
   * review/understood outcome. Works regardless of flip state.
   */
  const skipCard = (): void => {
    goToNextCard();
  };

  /**
   * Swipe-left/down: goes back to the previous card. Does not undo any
   * review/understood count already recorded — it only moves the index.
   * Clamped so it can never go below the first card.
   */
  const goToPreviousCard = (): void => {
    setIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      // Reset completion status when navigating back from the final card
      if (next < cards.length - 1) {
        hasCompletedRef.current = false;
      }
      return next;
    });
    resetFlip();
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
    skipCard,
    goToPreviousCard,
  };
}