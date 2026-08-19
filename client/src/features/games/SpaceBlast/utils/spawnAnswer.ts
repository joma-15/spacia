import { BUBBLE_EDGE_GAP, BUBBLE_GAP, BUBBLE_SPEED_MAX, BUBBLE_SPEED_MIN, FLOATING_ANSWER_COUNT } from "../constants";
import { SpaceObject } from "../types";
import { AnswerPool, pickInitialAnswers } from "./AnswerPool";
import { getBubbleDimensions } from "./answerSizing";
import { makeIdGenerator } from "./idGenerator";

const nextObjectId = makeIdGenerator();

export interface PlayArea {
  width: number;
  top: number;
  bottom: number;
}

const overlaps = (a: SpaceObject, b: SpaceObject) =>
  a.x < b.x + b.width + BUBBLE_GAP && a.x + a.width + BUBBLE_GAP > b.x &&
  a.y < b.y + b.height + BUBBLE_GAP && a.y + a.height + BUBBLE_GAP > b.y;

function velocity(speedMultiplier: number) {
  const speed = (BUBBLE_SPEED_MIN + Math.random() * (BUBBLE_SPEED_MAX - BUBBLE_SPEED_MIN)) * Math.min(speedMultiplier, 1.4);
  const angle = Math.random() * Math.PI * 2;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

export function createAnswer(label: string, isCorrect: boolean, laneIndex: number, area: PlayArea, occupied: SpaceObject[], speedMultiplier = 1): SpaceObject {
  const { width, height } = getBubbleDimensions(label, area.width);
  const minX = BUBBLE_EDGE_GAP;
  const maxX = Math.max(minX, area.width - width - BUBBLE_EDGE_GAP);
  const minY = area.top + BUBBLE_EDGE_GAP;
  const maxY = Math.max(minY, area.bottom - height - BUBBLE_EDGE_GAP);
  const candidate = (x: number, y: number): SpaceObject => ({
    id: nextObjectId(), x, y, width, height, ...velocity(speedMultiplier), stop: () => {}, label, isCorrect, laneIndex,
  });

  for (let attempt = 0; attempt < 120; attempt++) {
    const object = candidate(minX + Math.random() * (maxX - minX), minY + Math.random() * (maxY - minY));
    if (occupied.every((other) => !overlaps(object, other))) return object;
  }

  // A deterministic, in-bounds fallback for unusually small areas.
  const columns = 2;
  const row = Math.floor(laneIndex / columns);
  const col = laneIndex % columns;
  return candidate(
    Math.min(maxX, minX + col * (maxX - minX)),
    Math.min(maxY, minY + row * (height + BUBBLE_GAP)),
  );
}

export function buildInitialAnswerObjects(correctAnswer: string, pool: AnswerPool, area: PlayArea, speedMultiplier = 1): SpaceObject[] {
  if (!correctAnswer || area.width <= 0 || area.bottom <= area.top) return [];
  const labels = pickInitialAnswers(correctAnswer, pool, FLOATING_ANSWER_COUNT);
  let correctAssigned = false;
  return labels.reduce<SpaceObject[]>((objects, label, index) => {
    const isCorrect = !correctAssigned && label === correctAnswer;
    correctAssigned ||= isCorrect;
    objects.push(createAnswer(label, isCorrect, index, area, objects, speedMultiplier));
    return objects;
  }, []);
}
