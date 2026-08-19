import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlashCard } from "../types";
import { fisherYatesShuffle } from "../utils/shuffle";

const PLACEHOLDER_CARD: FlashCard = { id: "__placeholder__", question: "", answer: "", status: "review" };

/**
 * Tracks everything about "where are we in the deck right now":
 *  - which card is currently showing (in a shuffled play order, so
 *    questions don't always appear in the same sequence)
 *  - how many lives are left
 *  - whether the Win or Game Over popup should be showing
 *
 * Whenever the flashcard list itself changes (a new deck was loaded),
 * everything here resets automatically.
 */
export function useDeckProgress(flashcards: FlashCard[], maxLives: number) {
  // A cheap fingerprint so we can tell when the WHOLE deck changed
  // (new study set) vs. just a normal re-render.
  const flashcardsKey = useMemo(() => flashcards.map((c) => c.id).join("|"), [flashcards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const [lives, setLives] = useState(maxLives);
  // Mirrors `lives` synchronously, so code running inside a delayed
  // setTimeout can read the latest value without waiting on a re-render.
  const livesRef = useRef(lives);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  // Shuffled sequence of indexes into `flashcards`. `currentIndex` walks
  // through THIS array; `playOrderRef.current[currentIndex]` gives the
  // real flashcard index. Rebuilt only when the deck itself changes.
  const playOrderRef = useRef<number[]>(fisherYatesShuffle(flashcards.map((_, i) => i)));

  const prevDeckKeyRef = useRef(flashcardsKey);
  useEffect(() => {
    if (prevDeckKeyRef.current === flashcardsKey) return;
    prevDeckKeyRef.current = flashcardsKey;

    playOrderRef.current = fisherYatesShuffle(flashcards.map((_, i) => i));
    setCurrentIndex(0);
    setShowWinModal(false);
    setShowGameOverModal(false);
    setLives(maxLives);
  }, [flashcardsKey, flashcards, maxLives]);

  const safeIndex = flashcards.length > 0 ? Math.min(currentIndex, flashcards.length - 1) : 0;
  const currentCardIndex = playOrderRef.current[safeIndex] ?? safeIndex;
  const currentCard = flashcards[currentCardIndex] ?? PLACEHOLDER_CARD;
  const isLastCard = safeIndex >= flashcards.length - 1;

  // Floating answers drift a little faster/more erratically as the
  // player advances, capped so it never becomes unreadable.
  const speedMultiplier = useMemo(() => Math.min(1 + safeIndex * 0.08, 1.8), [safeIndex]);

  /** Looks up what the NEXT card (and its difficulty speed) will be. */
  const peekNextCard = useCallback(() => {
    const nextIndex = safeIndex + 1;
    const nextCardIndex = playOrderRef.current[nextIndex];
    const nextCard = nextCardIndex !== undefined ? flashcards[nextCardIndex] : undefined;
    return {
      nextIndex,
      nextCorrectAnswer: nextCard?.answer ?? "",
      nextSpeedMultiplier: Math.min(1 + nextIndex * 0.08, 1.8),
    };
  }, [safeIndex, flashcards]);

  const advanceToIndex = useCallback((nextIndex: number) => {
    setCurrentIndex(nextIndex);
  }, []);

  /**
   * Removes one life. If that was the last one, also opens the Game
   * Over modal — done together, inside the same state update, so the
   * two always stay in sync no matter when React actually applies it.
   */
  const loseLife = useCallback(() => {
    setLives((prev) => {
      const next = Math.max(0, prev - 1);
      livesRef.current = next;
      if (next <= 0) setShowGameOverModal(true);
      return next;
    });
  }, []);

  const restart = useCallback(() => {
    playOrderRef.current = fisherYatesShuffle(flashcards.map((_, i) => i));
    setCurrentIndex(0);
    setLives(maxLives);
    livesRef.current = maxLives;
    setShowWinModal(false);
    setShowGameOverModal(false);
  }, [flashcards, maxLives]);

  return {
    flashcardsKey,
    safeIndex,
    currentCardIndex,
    currentCard,
    isLastCard,
    speedMultiplier,
    lives,
    livesRef,
    showWinModal,
    setShowWinModal,
    showGameOverModal,
    setShowGameOverModal,
    peekNextCard,
    advanceToIndex,
    loseLife,
    restart,
  };
}
