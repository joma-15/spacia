import { Animated, Easing } from "react-native";
import { ANSWER_OBJECT_SIZE, FLOAT_MAX_DURATION, FLOAT_MIN_DURATION, FLOAT_AMPLITUDE_X, FLOAT_AMPLITUDE_Y, SCREEN_W } from "../constants";
import { SpaceObject } from "../types";
import { AnswerPool, pickInitialAnswers } from "./AnswerPool";
import { makeIdGenerator } from "./idGenerator";
import { estimateDisplaySize } from "./answerSizing";

const nextObjectId = makeIdGenerator();

// Minimum visible gap enforced between a bubble's worst-case footprint
// and its lane boundary, so neighboring bubbles never even touch
// edge-to-edge, let alone overlap.
const FOOTPRINT_MARGIN = 6;

// Extra breathing room reserved ONLY at the two physical screen edges
// (the outermost lanes), on top of FOOTPRINT_MARGIN. Bigger than the
// inter-lane margin on purpose — this accounts for device bezels,
// rounded corners, and edge swipe-gesture zones, not just avoiding
// another bubble.
const SCREEN_EDGE_MARGIN = 12;

/**
 * Picks a random position for a bubble's CENTER somewhere inside
 * [lowerBound, upperBound], guaranteeing at least `halfFootprint` of
 * clearance on both sides. If the bounds are too tight for that (e.g.
 * a very long label in a very narrow lane), falls back to dead center
 * rather than risking the bubble spilling past its boundary.
 */
function pickCenterWithinBounds(lowerBound: number, upperBound: number, halfFootprint: number): number {
  const min = lowerBound + halfFootprint;
  const max = upperBound - halfFootprint;
  if (min > max) return (lowerBound + upperBound) / 2;
  return min + Math.random() * (max - min);
}

/**
 * Drives a single Animated.Value in an ORGANIC WANDER, forever, until
 * something calls `.stopAnimation()` on it.
 *
 * Unlike a fixed back-and-forth loop (always bouncing between the same
 * two endpoints with the same duration every cycle), this picks a NEW
 * random resting point and a NEW random duration every time a move
 * finishes. That's what keeps the motion from settling into a
 * repeating, synced pattern with the other axis — which is what reads
 * to the eye as "moving in a straight line."
 */
function startWanderLoop(
  animVal: Animated.Value,
  minDuration: number,
  maxDuration: number,
  initialDelay: number,
) {
  let first = true;
  const step = () => {
    const target = Math.random();
    const duration = minDuration + Math.random() * (maxDuration - minDuration);

    Animated.timing(animVal, {
      toValue: target,
      duration,
      delay: first ? initialDelay : 0,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start(({ finished }) => {
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
 *
 * OVERLAP & SCREEN-EDGE PREVENTION: each bubble lives in its own lane
 * (a vertical column of the screen) for its whole lifetime. We reserve
 * room, when picking where a bubble sits, for its full worst-case
 * footprint — its text-driven display size (see answerSizing.ts, since
 * long labels render bigger) PLUS however far it can drift from its
 * resting position (ampX/ampY) — inside its lane bounds. That alone
 * guarantees bubbles in different lanes can never touch.
 *
 * The outermost lanes (laneIndex 0 and laneCount - 1) get an ADDITIONAL
 * SCREEN_EDGE_MARGIN reserved against the physical screen edge (x = 0
 * and x = SCREEN_W), on top of the normal footprint clearance, so a
 * bubble never renders flush against — or clipped by — the edge of the
 * device.
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
  const id = nextObjectId();

  const ampVariation = 0.85 + Math.random() * 0.3; // +/-15% per bubble
  const ampX = FLOAT_AMPLITUDE_X * ampVariation * Math.min(speedMultiplier, 1.4);
  const ampY = FLOAT_AMPLITUDE_Y * ampVariation * Math.min(speedMultiplier, 1.4);

  // Worst-case rendered size for this label — matches exactly what
  // AnswerBubble will draw, since both pull from answerSizing.ts.
  const maxDisplaySize = estimateDisplaySize(size, label);
  const maxRadius = maxDisplaySize / 2;

  const laneWidth = SCREEN_W / laneCount;
  let laneLeft = laneWidth * laneIndex;
  let laneRight = laneLeft + laneWidth;

  // Pull the outermost lane boundaries in from the actual screen edge.
  if (laneIndex === 0) laneLeft += SCREEN_EDGE_MARGIN;
  if (laneIndex === laneCount - 1) laneRight -= SCREEN_EDGE_MARGIN;

  const centerX = pickCenterWithinBounds(laneLeft, laneRight, maxRadius + ampX + FOOTPRINT_MARGIN);
  const x = centerX - size / 2;

  const centerY = pickCenterWithinBounds(playAreaTop, playAreaBottom, maxRadius + ampY + FOOTPRINT_MARGIN);
  const y = centerY - size / 2;

  const animX = new Animated.Value(0.5);
  const animY = new Animated.Value(0.5);

  // Duration bounds each wander "hop" is drawn from. speedMultiplier
  // shortens these as the player advances (faster, twitchier drift).
  const minDur = FLOAT_MIN_DURATION / speedMultiplier;
  const maxDur = FLOAT_MAX_DURATION / speedMultiplier;

  const xDelay = Math.random() * FLOAT_MAX_DURATION;
  const yDelay = Math.random() * FLOAT_MAX_DURATION;

  let currentX = x;
  let currentY = y;
  // animX/animY now wander over [0,1], where 0.5 is the resting
  // position (no offset) — map that onto [-amp, +amp].
  const toOffset = (amp: number, value: number) => (value - 0.5) * 2 * amp;

  onUpdate(id, currentX, currentY);

  const listenerIdX = animX.addListener(({ value }) => {
    currentX = x + toOffset(ampX, value);
    onUpdate(id, currentX, currentY);
  });
  const listenerIdY = animY.addListener(({ value }) => {
    currentY = y + toOffset(ampY, value);
    onUpdate(id, currentX, currentY);
  });

  startWanderLoop(animX, minDur, maxDur, xDelay);
  startWanderLoop(animY, minDur, maxDur, yDelay);

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