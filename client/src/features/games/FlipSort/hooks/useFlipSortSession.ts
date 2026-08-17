import { useRef, useState } from "react";
import type { Flashcard } from "../types";

interface Params {
  cards: Flashcard[];
  onUpdateCardStatus: (cardId: string, status: "review" | "understood") => void;
  /** Called after the player explicitly dismisses the completion UI. */
  onComplete?: () => void;
  resetFlip: () => void;
}

interface CompletionCounts {
  understood: number;
  review: number;
}

export function useFlipSortSession({ cards, onUpdateCardStatus, onComplete, resetFlip }: Params) {
  const [index, setIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [completionCounts, setCompletionCounts] = useState<CompletionCounts | null>(null);
  const hasCompletedRef = useRef(false);
  const hasDismissedCompletionRef = useRef(false);

  const currentCard = cards[index];
  const progressPercent = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;
  const reviewCount = cards.filter((card) => card.status === "review").length;
  const understoodCount = cards.filter((card) => card.status === "understood").length;

  const complete = (lastCardStatusChange?: { id: string; status: "review" | "understood" }) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    let understood = 0;
    let review = 0;
    for (const card of cards) {
      const status = lastCardStatusChange && card.id === lastCardStatusChange.id
        ? lastCardStatusChange.status
        : card.status;
      if (status === "understood") understood += 1;
      if (status === "review") review += 1;
    }
    setCompletionCounts({ understood, review });
    setIsComplete(true);
  };

  const goToNextCard = (lastCardStatusChange?: { id: string; status: "review" | "understood" }): void => {
    setIndex((previousIndex) => {
      if (previousIndex + 1 >= cards.length) {
        complete(lastCardStatusChange);
        return previousIndex;
      }
      return previousIndex + 1;
    });
    resetFlip();
  };

  const markForReview = (): void => {
    if (!currentCard || isComplete) return;
    onUpdateCardStatus(currentCard.id, "review");
    goToNextCard({ id: currentCard.id, status: "review" });
  };

  const markAsUnderstood = (): void => {
    if (!currentCard || isComplete) return;
    onUpdateCardStatus(currentCard.id, "understood");
    goToNextCard({ id: currentCard.id, status: "understood" });
  };

  const skipCard = (): void => {
    if (!isComplete) goToNextCard();
  };

  const goToPreviousCard = (): void => {
    setIndex((previousIndex) => {
      const nextIndex = Math.max(previousIndex - 1, 0);
      if (nextIndex < cards.length - 1) {
        hasCompletedRef.current = false;
        hasDismissedCompletionRef.current = false;
        setIsComplete(false);
        setCompletionCounts(null);
      }
      return nextIndex;
    });
    resetFlip();
  };

  const dismissCompletion = (): void => {
    if (!isComplete || hasDismissedCompletionRef.current) return;
    hasDismissedCompletionRef.current = true;
    setIsComplete(false);
    onComplete?.();
  };

  return {
    index,
    currentCard,
    reviewCount,
    understoodCount,
    completionReviewCount: completionCounts?.review ?? reviewCount,
    completionUnderstoodCount: completionCounts?.understood ?? understoodCount,
    progressPercent,
    totalCards: cards.length,
    isComplete,
    dismissCompletion,
    markForReview,
    markAsUnderstood,
    skipCard,
    goToPreviousCard,
  };
}
