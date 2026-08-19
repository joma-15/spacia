import { useCallback, useEffect, useRef, useState } from "react";
import { BUBBLE_EDGE_GAP, BUBBLE_GAP } from "../constants";
import { FlashCard, HitState, HitStatesMap, SpaceObject } from "../types";
import { AnswerPool } from "../utils/AnswerPool";
import { buildInitialAnswerObjects, PlayArea } from "../utils/spawnAnswer";

interface Params {
  flashcards: FlashCard[];
  flashcardsKey: string;
  currentCard: FlashCard;
  isReady: boolean;
  hasEnoughCards: boolean;
  speedMultiplier: number;
  playArea: PlayArea;
  paused: boolean;
}

const collides = (a: SpaceObject, b: SpaceObject) =>
  a.x < b.x + b.width + BUBBLE_GAP && a.x + a.width + BUBBLE_GAP > b.x &&
  a.y < b.y + b.height + BUBBLE_GAP && a.y + a.height + BUBBLE_GAP > b.y;

export function useFloatingAnswers({ flashcards, flashcardsKey, currentCard, isReady, hasEnoughCards, speedMultiplier, playArea, paused }: Params) {
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [hitStates, setHitStates] = useState<HitStatesMap>({});
  const objectsRef = useRef(objects);
  const objectPosRef = useRef(new Map<number, { x: number; y: number }>());
  const answerPoolRef = useRef(new AnswerPool(flashcards));
  const skipNextCardResetRef = useRef(false);
  const previousDeckKeyRef = useRef(flashcardsKey);
  const previousCardIdRef = useRef(currentCard.id);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const syncObjects = useCallback((next: SpaceObject[]) => {
    objectsRef.current = next;
    objectPosRef.current = new Map(next.map((object) => [object.id, { x: object.x, y: object.y }]));
    setObjects(next);
  }, []);
  const setManagedObjects = useCallback((next: SpaceObject[] | ((previous: SpaceObject[]) => SpaceObject[])) => {
    const resolved = typeof next === "function" ? next(objectsRef.current) : next;
    syncObjects(resolved);
  }, [syncObjects]);

  const buildBoard = useCallback(() => buildInitialAnswerObjects(currentCard.answer, answerPoolRef.current, playArea, speedMultiplier), [currentCard.answer, playArea, speedMultiplier]);

  useEffect(() => {
    if (previousDeckKeyRef.current === flashcardsKey) return;
    previousDeckKeyRef.current = flashcardsKey;
    answerPoolRef.current.updateCards(flashcards);
  }, [flashcards, flashcardsKey]);

  useEffect(() => {
    if (!isReady || !hasEnoughCards || paused || playArea.width <= 0) return;
    if (previousCardIdRef.current !== currentCard.id) {
      previousCardIdRef.current = currentCard.id;
      if (skipNextCardResetRef.current) skipNextCardResetRef.current = false;
      else {
        setHitStates({});
        syncObjects(buildBoard());
      }
    } else if (objectsRef.current.length === 0) {
      syncObjects(buildBoard());
    }
  }, [buildBoard, currentCard.id, hasEnoughCards, isReady, paused, playArea.width, syncObjects]);

  useEffect(() => {
    if (paused || objectsRef.current.length === 0) return;
    const tick = (time: number) => {
      const previous = lastFrameRef.current ?? time;
      const elapsed = Math.min(0.05, (time - previous) / 1000);
      lastFrameRef.current = time;
      const moved = objectsRef.current.map((object) => ({ ...object, x: object.x + object.vx * elapsed, y: object.y + object.vy * elapsed }));

      for (const object of moved) {
        const minX = BUBBLE_EDGE_GAP;
        const maxX = Math.max(minX, playArea.width - object.width - BUBBLE_EDGE_GAP);
        const minY = playArea.top + BUBBLE_EDGE_GAP;
        const maxY = Math.max(minY, playArea.bottom - object.height - BUBBLE_EDGE_GAP);
        if (object.x <= minX || object.x >= maxX) { object.x = Math.max(minX, Math.min(maxX, object.x)); object.vx *= -1; }
        if (object.y <= minY || object.y >= maxY) { object.y = Math.max(minY, Math.min(maxY, object.y)); object.vy *= -1; }
      }

      // Two short passes resolve a three-bubble chain without allowing a
      // correction for one pair to leave the third pair intersecting.
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < moved.length; i++) for (let j = i + 1; j < moved.length; j++) {
        const a = moved[i], b = moved[j];
        if (!collides(a, b)) continue;
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + BUBBLE_GAP;
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + BUBBLE_GAP;
        if (overlapX < overlapY) {
          const direction = a.x + a.width / 2 < b.x + b.width / 2 ? -1 : 1;
          a.x += direction * overlapX / 2; b.x -= direction * overlapX / 2; a.vx *= -1; b.vx *= -1;
        } else {
          const direction = a.y + a.height / 2 < b.y + b.height / 2 ? -1 : 1;
          a.y += direction * overlapY / 2; b.y -= direction * overlapY / 2; a.vy *= -1; b.vy *= -1;
        }
      }
      for (const object of moved) {
        object.x = Math.max(BUBBLE_EDGE_GAP, Math.min(playArea.width - object.width - BUBBLE_EDGE_GAP, object.x));
        object.y = Math.max(playArea.top + BUBBLE_EDGE_GAP, Math.min(playArea.bottom - object.height - BUBBLE_EDGE_GAP, object.y));
      }
      syncObjects(moved);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; lastFrameRef.current = null; };
  }, [objects.length, paused, playArea.bottom, playArea.top, playArea.width, syncObjects]);

  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); }, []);

  const updateObjectPos = useCallback((id: number, x: number, y: number) => objectPosRef.current.set(id, { x, y }), []);
  const markHit = useCallback((id: number, result: HitState) => setHitStates((prev) => ({ ...prev, [id]: result })), []);
  const clearHit = useCallback((id: number) => setHitStates((prev) => { const next = { ...prev }; delete next[id]; return next; }), []);
  const reset = useCallback(() => { setHitStates({}); syncObjects(buildBoard()); }, [buildBoard, syncObjects]);

  return { objects, setObjects: setManagedObjects, objectsRef, hitStates, markHit, clearHit, objectPosRef, updateObjectPos, answerPoolRef, skipNextCardResetRef, reset };
}
