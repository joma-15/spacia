import { AnswerPool } from "./AnswerPool";
import { spawnAnswerInLane } from "./spawnAnswer";
import { SpaceObject } from "../types";

/**
 * These two functions answer one question: "the player just shot a
 * bubble — what should the board of floating answers look like now?"
 *
 * They are pure-ish helpers (their only side effect is drawing from the
 * AnswerPool, which is expected and intentional) so the tricky swap
 * logic can be tested and read on its own, separate from React state
 * and animation wiring.
 */

interface SpawnContext {
  laneCount: number;
  topSafeZone: number;
  bottomSafeZone: number;
  updateObjectPos: (id: number, x: number, y: number) => void;
  speedMultiplier: number;
}

/**
 * Called when the player shot the CORRECT answer.
 *
 * `remaining` is every other bubble still on screen (the hit one is
 * already removed). We need to place the next question's correct
 * answer somewhere on the board — but NOT always in the slot that just
 * opened up, or the "new" bubble would always be a dead giveaway that
 * it's the right one. So:
 *
 *  1. If the next correct answer happens to already be floating among
 *     the survivors, just drop a fresh distractor into the open slot.
 *  2. Otherwise, flip a coin across every open slot (the vacated one
 *     PLUS every bubble already on screen). Whichever slot "wins"
 *     becomes the correct answer; everything else gets a distractor.
 */
export function resolveCorrectHit(
  remaining: SpaceObject[],
  hitObject: SpaceObject,
  nextCorrectAnswer: string,
  pool: AnswerPool,
  ctx: SpawnContext,
): SpaceObject[] {
  const remainingLabels = new Set(remaining.map((o) => o.label));

  let replacementLabel: string;
  let replacementIsCorrect: boolean;
  let updatedRemaining = remaining;

  if (remainingLabels.has(nextCorrectAnswer)) {
    const distractor = pool.pickDistractor(new Set([...remainingLabels, nextCorrectAnswer]));
    replacementLabel = distractor ?? hitObject.label;
    replacementIsCorrect = false;
  } else if (remaining.length === 0) {
    // No other bubbles to relabel — the vacated slot is the only option.
    replacementLabel = nextCorrectAnswer;
    replacementIsCorrect = true;
  } else {
    const slotCount = remaining.length + 1; // +1 = the vacated slot
    const chosenSlot = Math.floor(Math.random() * slotCount);

    if (chosenSlot === remaining.length) {
      // The vacated slot itself won the coin flip.
      replacementLabel = nextCorrectAnswer;
      replacementIsCorrect = true;
    } else {
      // An already-floating bubble becomes the correct answer instead;
      // the vacated slot gets a distractor.
      updatedRemaining = remaining.map((o, i) =>
        i === chosenSlot ? { ...o, label: nextCorrectAnswer, isCorrect: true } : o,
      );
      const distractor = pool.pickDistractor(new Set([...remainingLabels, nextCorrectAnswer]));
      replacementLabel = distractor ?? hitObject.label;
      replacementIsCorrect = false;
    }
  }

  const replacement = spawnAnswerInLane(
    replacementLabel,
    replacementIsCorrect,
    hitObject.laneIndex,
    ctx.laneCount,
    ctx.topSafeZone,
    ctx.bottomSafeZone,
    ctx.updateObjectPos,
    ctx.speedMultiplier,
  );

  return [...updatedRemaining, replacement];
}

/**
 * Called when the player shot a WRONG answer. The destroyed bubble's
 * lane gets a brand new distractor — always a real answer pulled from
 * the deck, always unique against everything currently visible
 * (including the current question's correct answer, so it can't
 * accidentally duplicate it).
 */
export function resolveWrongHit(
  remaining: SpaceObject[],
  hitObject: SpaceObject,
  currentCorrectAnswer: string,
  pool: AnswerPool,
  ctx: SpawnContext,
): SpaceObject[] {
  const remainingLabels = new Set(remaining.map((o) => o.label));
  remainingLabels.add(currentCorrectAnswer);

  const distractor = pool.pickDistractor(remainingLabels);
  const replacementLabel = distractor ?? hitObject.label;

  return [
    ...remaining,
    spawnAnswerInLane(
      replacementLabel,
      false,
      hitObject.laneIndex,
      ctx.laneCount,
      ctx.topSafeZone,
      ctx.bottomSafeZone,
      ctx.updateObjectPos,
      ctx.speedMultiplier,
    ),
  ];
}
