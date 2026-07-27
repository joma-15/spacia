import { useCallback, useMemo } from "react";
import { GestureResponderEvent } from "react-native";
import { FlashCard, SpaceObject } from "../types";
import { useAssetPreload } from "./useAssetPreload";
import { useDeckProgress } from "./useDeckProgress";
import { useFloatingAnswers } from "./useFloatingAnswers";
import { useBullets } from "./useBullets";
import { resolveCorrectHit, resolveWrongHit } from "../utils/resolveHit";

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
  topSafeZone: number;
  bottomSafeZone: number;
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
  topSafeZone,
  bottomSafeZone,
}: Params) {
  const assetsReady = useAssetPreload();
  const isReady = assetsReady && !isDataLoading;
  const hasEnoughCards = flashcards.length >= minFlashcards;

  const deck = useDeckProgress(flashcards, maxLives);

  const floating = useFloatingAnswers({
    flashcards,
    flashcardsKey: deck.flashcardsKey,
    currentCard: deck.currentCard,
    isReady,
    hasEnoughCards,
    speedMultiplier: deck.speedMultiplier,
    topSafeZone,
    bottomSafeZone,
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
      if (!hitObject) return;

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
            laneCount: floating.laneCountRef.current,
            topSafeZone,
            bottomSafeZone,
            updateObjectPos: floating.updateObjectPos,
            speedMultiplier: nextSpeedMultiplier,
          };

          if (hitObject.isCorrect) {
            if (deck.isLastCard) {
              remaining.forEach((o) => o.stop());
              deck.setShowWinModal(true);
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
    [floating, deck, onAnswer, topSafeZone, bottomSafeZone],
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
      if (locationY < topSafeZone || locationY > bottomSafeZone) return;

      const hitObject = floating.objects.find((obj) => {
        const pos = floating.objectPosRef.current.get(obj.id) ?? { x: obj.x, y: obj.y };
        const cx = pos.x + obj.size / 2;
        const cy = pos.y + obj.size / 2;
        const dist = Math.sqrt((locationX - cx) ** 2 + (locationY - cy) ** 2);
        return dist <= obj.size / 2 + 10;
      });

      if (hitObject) {
        const pos = floating.objectPosRef.current.get(hitObject.id) ?? { x: hitObject.x, y: hitObject.y };
        fireBullet(pos.x + hitObject.size / 2, pos.y + hitObject.size / 2, hitObject);
      } else {
        fireBullet(locationX, locationY);
      }
    },
    [blockInput, topSafeZone, bottomSafeZone, floating.objects, floating.objectPosRef, fireBullet],
  );

  return useMemo(
    () => ({
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
    }),
    [
      isReady,
      hasEnoughCards,
      showGame,
      floating.objects,
      floating.hitStates,
      bullets,
      explosions,
      handleExplosionDone,
      handleTap,
      deck.lives,
      deck.showWinModal,
      deck.setShowWinModal,
      deck.showGameOverModal,
      deck.setShowGameOverModal,
      deck.currentCard,
      deck.safeIndex,
    ],
  );
}
