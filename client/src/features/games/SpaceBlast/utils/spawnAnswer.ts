import { Animated, Easing } from "react-native";
import { ANSWER_OBJECT_SIZE, FLOAT_MAX_DURATION, FLOAT_MIN_DURATION, FLOAT_AMPLITUDE_X, FLOAT_AMPLITUDE_Y, SCREEN_W } from "../constants";
import { SpaceObject } from "../types";
import { AnswerPool, pickInitialAnswers } from "./AnswerPool";
import { makeIdGenerator } from "./idGenerator";

const nextObjectId = makeIdGenerator();

/**
 * Picks a random horizontal position for a bubble inside its "lane"
 * (the screen is split into even vertical columns, one per bubble, so
 * bubbles don't all cluster in the same spot).
 */
function laneX(laneIndex: number, laneCount: number): number {
  const laneWidth = SCREEN_W / laneCount;
  const freeSpace = laneWidth - ANSWER_OBJECT_SIZE;
  const maxJitter = Math.max(0, freeSpace * 0.2);
  const jitter = (Math.random() - 0.5) * 2 * maxJitter;
  const laneCenter = laneWidth * laneIndex + laneWidth / 2;
  return laneCenter - ANSWER_OBJECT_SIZE / 2 + jitter;
}

/**
 * Starts a slow back-and-forth "floating" animation on a single
 * Animated.Value, forever, until something calls `.stopAnimation()` on it.
 */
function startFloatLoop(
  animVal: Animated.Value,
  duration: number,
  initialDelay: number,
) {
  let first = true;
  const step = () => {
    Animated.sequence([
      Animated.timing(animVal, {
        toValue: 1,
        duration,
        delay: first ? initialDelay : 0,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(animVal, {
        toValue: 0,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      first = false;
      if (finished) step();
    });
  };
  step();
}

/**
 * Creates one floating answer bubble ("space rock") inside a given lane,
 * already animating. `onUpdate` is called every time its on-screen
 * position changes, so the caller can track where it currently is
 * (needed later for tap detection and explosion placement).
 *
 * `speedMultiplier` makes bubbles drift faster/more erratically as the
 * player advances further into the deck (difficulty ramp-up).
 */
export function spawnAnswerInLane(
  label: string,
  isCorrect: boolean,
  laneIndex: number,
  laneCount: number,
  playAreaTop: number,
  playAreaBottom: number,
  onUpdate: (id: number, x: number, y: number) => void,
  speedMultiplier: number = 1,
): SpaceObject {
  const size = ANSWER_OBJECT_SIZE;
  const x = laneX(laneIndex, laneCount);
  const usableHeight = Math.max(0, playAreaBottom - playAreaTop - size);
  const y = playAreaTop + Math.random() * usableHeight;
  const id = nextObjectId();

  const animX = new Animated.Value(0);
  const animY = new Animated.Value(0);

  const xDuration =
    (FLOAT_MIN_DURATION + Math.random() * (FLOAT_MAX_DURATION - FLOAT_MIN_DURATION)) /
    speedMultiplier;
  const yDuration =
    (FLOAT_MIN_DURATION + Math.random() * (FLOAT_MAX_DURATION - FLOAT_MIN_DURATION)) /
    speedMultiplier;

  const xDelay = Math.random() * FLOAT_MAX_DURATION;
  const yDelay = Math.random() * FLOAT_MAX_DURATION;

  const ampVariation = 0.85 + Math.random() * 0.3; // +/-15% per bubble
  const ampX = FLOAT_AMPLITUDE_X * ampVariation * Math.min(speedMultiplier, 1.4);
  const ampY = FLOAT_AMPLITUDE_Y * ampVariation * Math.min(speedMultiplier, 1.4);

  let currentX = x;
  let currentY = y;
  const toOffset = (amp: number, value: number) => -amp + value * 2 * amp;

  onUpdate(id, currentX, currentY);

  const listenerIdX = animX.addListener(({ value }) => {
    currentX = x + toOffset(ampX, value);
    onUpdate(id, currentX, currentY);
  });
  const listenerIdY = animY.addListener(({ value }) => {
    currentY = y + toOffset(ampY, value);
    onUpdate(id, currentX, currentY);
  });

  startFloatLoop(animX, xDuration, xDelay);
  startFloatLoop(animY, yDuration, yDelay);

  const stop = () => {
    animX.stopAnimation();
    animX.removeListener(listenerIdX);
    animY.stopAnimation();
    animY.removeListener(listenerIdY);
  };

  return { id, x, y, size, animX, animY, stop, label, isCorrect, laneIndex, ampX, ampY };
}

/**
 * Builds the full starting board of floating answers for one question:
 * the correct answer plus a handful of real distractors, each placed in
 * its own lane.
 */
export function buildInitialAnswerObjects(
  correctAnswer: string,
  pool: AnswerPool,
  playAreaTop: number,
  playAreaBottom: number,
  onUpdate: (id: number, x: number, y: number) => void,
  minCount: number,
  maxCount: number,
  speedMultiplier: number = 1,
): SpaceObject[] {
  if (!correctAnswer) return [];

  const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
  const labels = pickInitialAnswers(correctAnswer, pool, count);

  return labels.map((label, laneIndex) =>
    spawnAnswerInLane(
      label,
      label === correctAnswer,
      laneIndex,
      labels.length,
      playAreaTop,
      playAreaBottom,
      onUpdate,
      speedMultiplier,
    ),
  );
}
