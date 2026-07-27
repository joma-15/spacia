import { useCallback, useEffect, useRef, useState } from "react";
import { FlashCard, HitState, HitStatesMap, SpaceObject } from "../types";
import { AnswerPool } from "../utils/AnswerPool";
import { buildInitialAnswerObjects } from "../utils/spawnAnswer";
import { FLOATING_ANSWER_MIN, FLOATING_ANSWER_MAX } from "../constants";

interface Params {
  flashcards: FlashCard[];
  flashcardsKey: string;
  currentCard: FlashCard;
  isReady: boolean;
  hasEnoughCards: boolean;
  speedMultiplier: number;
  topSafeZone: number;
  bottomSafeZone: number;
}

/**
 * Owns the board of floating answer bubbles: what's currently on
 * screen, where each one is, and which ones just got hit.
 *
 * It automatically rebuilds the whole board when the question changes
 * — UNLESS `skipNextCardResetRef.current` is set to true. That flag is
 * used by the "correct answer" hit-handling code (see useSpaceBlastEngine)
 * to say "I already swapped in the new bubble myself, don't rebuild
 * everything and cause a flicker."
 */
export function useFloatingAnswers({
  flashcards,
  flashcardsKey,
  currentCard,
  isReady,
  hasEnoughCards,
  speedMultiplier,
  topSafeZone,
  bottomSafeZone,
}: Params) {
  const currentCorrectAnswer = currentCard.answer;

  // Single source of truth for every distractor shown in the game.
  // Created once and mutated in place — never rebuilt on every render.
  const answerPoolRef = useRef<AnswerPool>(new AnswerPool(flashcards));
  const prevDeckKeyRef = useRef(flashcardsKey);
  useEffect(() => {
    if (prevDeckKeyRef.current === flashcardsKey) return;
    prevDeckKeyRef.current = flashcardsKey;
    answerPoolRef.current.updateCards(flashcards);
  }, [flashcardsKey, flashcards]);

  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [hitStates, setHitStates] = useState<HitStatesMap>({});

  const objectsRef = useRef<SpaceObject[]>(objects);
  const laneCountRef = useRef<number>(FLOATING_ANSWER_MIN);
  useEffect(() => {
    objectsRef.current = objects;
    laneCountRef.current = objects.length > 0 ? objects.length : FLOATING_ANSWER_MIN;
  }, [objects]);

  // Tracks each bubble's live on-screen position (it's always moving).
  const objectPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const updateObjectPos = useCallback((id: number, x: number, y: number) => {
    objectPosRef.current.set(id, { x, y });
  }, []);

  // See the doc comment above — set this to true right before advancing
  // to the next card if you've already patched the board yourself.
  const skipNextCardResetRef = useRef(false);

  const buildBoardForCurrentCard = useCallback(() => {
    return buildInitialAnswerObjects(
      currentCorrectAnswer,
      answerPoolRef.current,
      topSafeZone,
      bottomSafeZone,
      updateObjectPos,
      FLOATING_ANSWER_MIN,
      FLOATING_ANSWER_MAX,
      speedMultiplier,
    );
  }, [currentCorrectAnswer, topSafeZone, bottomSafeZone, updateObjectPos, speedMultiplier]);

  // Fires exactly once, the moment the game first becomes playable
  // (assets loaded + enough cards) — spawns the very first round.
  const gameInitializedRef = useRef(false);
  useEffect(() => {
    if (!isReady || !hasEnoughCards || gameInitializedRef.current) return;
    gameInitializedRef.current = true;
    setObjects(buildBoardForCurrentCard());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hasEnoughCards]);

  // Rebuilds the whole board whenever the question changes, unless the
  // hit-handling logic already patched it in place (see skip flag above).
  const cardIdRef = useRef<string>(currentCard.id);
  useEffect(() => {
    if (cardIdRef.current === currentCard.id) return;
    cardIdRef.current = currentCard.id;

    if (skipNextCardResetRef.current) {
      skipNextCardResetRef.current = false;
      return;
    }

    if (!hasEnoughCards || !isReady) return;

    objectsRef.current.forEach((o) => o.stop());
    objectPosRef.current.clear();
    setObjects(buildBoardForCurrentCard());
    setHitStates({});
  }, [currentCard, hasEnoughCards, isReady, buildBoardForCurrentCard]);

  // Stop every running animation when this hook unmounts.
  useEffect(() => {
    return () => {
      objectsRef.current.forEach((o) => o.stop());
    };
  }, []);

  const markHit = useCallback((id: number, result: HitState) => {
    setHitStates((prev) => ({ ...prev, [id]: result }));
  }, []);

  const clearHit = useCallback((id: number) => {
    setHitStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return {
    objects,
    setObjects,
    objectsRef,
    hitStates,
    markHit,
    clearHit,
    objectPosRef,
    updateObjectPos,
    laneCountRef,
    answerPoolRef,
    skipNextCardResetRef,
  };
}
