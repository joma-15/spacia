import { useCallback, useRef } from "react";
import { GestureResponderEvent } from "react-native";
import { FlashCard, SpaceObject } from "../types";
import { useAssetPreload } from "./useAssetPreload";
import { useDeckProgress } from "./useDeckProgress";
import { useFloatingAnswers } from "./useFloatingAnswers";
import { useBullets } from "./useBullets";
import { resolveCorrectHit, resolveWrongHit } from "../utils/resolveHit";
import { PlayArea } from "../utils/spawnAnswer";

interface Params {
  flashcards: FlashCard[];
  minFlashcards: number;
  maxLives: number;
  maxBullets: number;
  fireCooldownMs: number;
  isDataLoading: boolean;
  onAnswer?: (cardId: string, correct: boolean, answerText: string) => void;

  // Layout, computed by the screen based on insets/device size.
  shipX: number;
  shipY: number;
  shipSize: number;
  playArea: PlayArea;
}

/**
 * This is the "brain" of the SpaceBlast game. It combines the smaller
 * hooks (asset loading, deck progress, floating answers, bullets) into
 * one place and exposes exactly what the screen needs to render:
 * current state, plus a single `handleTap` function for input.
 *
 * Nothing in here knows about navigation, headers, or modals' visuals —
 * it only tracks game STATE. The screen component is responsible for
 * turning that state into pixels.
 */
export function useSpaceBlastEngine({
  flashcards,
  minFlashcards,
  maxLives,
  maxBullets,
  fireCooldownMs,
  isDataLoading,
  onAnswer,
  shipX,
  shipY,
  shipSize,
  playArea,
}: Params) {
  const assetsReady = useAssetPreload();
  const isReady = assetsReady && !isDataLoading;
  const hasEnoughCards = flashcards.length >= minFlashcards;

  const deck = useDeckProgress(flashcards, maxLives);
  const gameEndedRef = useRef(false);

  const floating = useFloatingAnswers({
    flashcards,
    flashcardsKey: deck.flashcardsKey,
    currentCard: deck.currentCard,
    isReady,
    hasEnoughCards,
    speedMultiplier: deck.speedMultiplier,
    playArea,
    paused: deck.showWinModal || deck.showGameOverModal,
  });

  const showGame = isReady && hasEnoughCards;

  const blockInput = deck.showWinModal || deck.showGameOverModal || !hasEnoughCards || !isReady;

  const getObjectPos = useCallback(
    (id: number) => floating.objectPosRef.current.get(id),
    [floating.objectPosRef],
  );

  // Called once a fired bullet has finished traveling. This is where a
  // hit actually gets turned into game consequences: advancing the
  // deck, losing a life, and updating the board of floating answers.
  const handleBulletSettled = useCallback(
    (hitObject: SpaceObject | undefined) => {
      if (!hitObject || gameEndedRef.current) return;

      floating.markHit(hitObject.id, hitObject.isCorrect ? "correct" : "wrong");
      onAnswer?.(deck.currentCard.id, hitObject.isCorrect, hitObject.label);

      if (!hitObject.isCorrect) {
        deck.loseLife();
      }

      const { nextIndex, nextCorrectAnswer, nextSpeedMultiplier } = deck.peekNextCard();

      // Small delay so the "hit flash" animation on the bubble has time
      // to play before we swap it out.
      setTimeout(() => {
        hitObject.stop();
        floating.objectPosRef.current.delete(hitObject.id);

        floating.setObjects((prev) => {
          const remaining = prev.filter((o) => o.id !== hitObject.id);
          const pool = floating.answerPoolRef.current;
          const spawnCtx = {
            playArea,
            speedMultiplier: nextSpeedMultiplier,
          };

          if (hitObject.isCorrect) {
            if (deck.isLastCard) {
              gameEndedRef.current = true;
              remaining.forEach((o) => o.stop());
              if (!deck.showGameOverModal) deck.setShowWinModal(true);
              return [];
            }

            // Only the hit bubble disappears — every other bubble stays
            // exactly where it is. Tell useFloatingAnswers not to do its
            // own full-board rebuild for this particular card change,
            // since we're patching it in by hand right here.
            floating.skipNextCardResetRef.current = true;
            deck.advanceToIndex(nextIndex);

            return resolveCorrectHit(remaining, hitObject, nextCorrectAnswer, pool, spawnCtx);
          }

          if (deck.livesRef.current <= 0) {
            gameEndedRef.current = true;
            remaining.forEach((o) => o.stop());
            return [];
          }

          return resolveWrongHit(remaining, hitObject, deck.currentCard.answer, pool, {
            ...spawnCtx,
            speedMultiplier: deck.speedMultiplier,
          });
        });

        floating.clearHit(hitObject.id);
      }, 220);
    },
    [floating, deck, onAnswer, playArea],
  );

  const { bullets, explosions, fireBullet, handleExplosionDone } = useBullets({
    shipX,
    shipY,
    shipSize,
    fireCooldownMs,
    maxBullets,
    blockInput,
    getObjectPos,
    onSettled: handleBulletSettled,
  });

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      if (blockInput) return;

      const { locationX, locationY } = evt.nativeEvent;
      if (locationY < playArea.top || locationY > playArea.bottom) return;

      const hitObject = floating.objects.find((obj) => {
        const pos = floating.objectPosRef.current.get(obj.id) ?? { x: obj.x, y: obj.y };
        return locationX >= pos.x - 10 && locationX <= pos.x + obj.width + 10 &&
          locationY >= pos.y - 10 && locationY <= pos.y + obj.height + 10;
      });

      if (hitObject) {
        const pos = floating.objectPosRef.current.get(hitObject.id) ?? { x: hitObject.x, y: hitObject.y };
        fireBullet(pos.x + hitObject.width / 2, pos.y + hitObject.height / 2, hitObject);
      } else {
        fireBullet(locationX, locationY);
      }
    },
    [blockInput, playArea.bottom, playArea.top, floating.objects, floating.objectPosRef, fireBullet],
  );

  return {
      isReady,
      hasEnoughCards,
      showGame,
      objects: floating.objects,
      hitStates: floating.hitStates,
      bullets,
      explosions,
      handleExplosionDone,
      handleTap,
      lives: deck.lives,
      showWinModal: deck.showWinModal,
      setShowWinModal: deck.setShowWinModal,
      showGameOverModal: deck.showGameOverModal,
      setShowGameOverModal: deck.setShowGameOverModal,
      currentCard: deck.currentCard,
      safeIndex: deck.safeIndex,
      restart: () => {
        gameEndedRef.current = false;
        deck.restart();
        floating.reset();
      },
  };
}
