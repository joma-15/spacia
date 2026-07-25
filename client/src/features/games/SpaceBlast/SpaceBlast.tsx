import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  ViewStyle,
  Pressable,
  GestureResponderEvent,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { BASE_URL } from "@/shared/config/api";
import {
  getFlashcardsByFolder,
  updateFlashcardStatus,
  replaceFlashcardsForFolder,
} from "@/shared/database/flashcardRepository";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/* ═══════════════════════════════════════════════════════════════════════
 * THEME — all colors/radii/shadows in one place, edit here to re-skin.
 * ═══════════════════════════════════════════════════════════════════════ */
const THEME = {
  bg: "#0F1F17",
  bgCard: "#162B1E",
  bgElevated: "#1C3527",

  primary: "#3DDC84",
  primaryDim: "#2AAF63",
  primaryGlow: "rgba(61,220,132,0.25)",

  correct: "#3DDC84",
  correctGlow: "rgba(61,220,132,0.35)",
  wrong: "#E05C7A",
  wrongGlow: "rgba(224,92,122,0.35)",

  textWhite: "#F0FFF6",
  textMid: "#A8C5B0",
  textMuted: "#5A7A65",

  border: "#243D2C",
  borderBright: "#2E5438",

  panelBg: "rgba(15,31,23,0.78)",
  panelBorder: "rgba(61,220,132,0.35)",

  overlayBg: "rgba(6,14,10,0.82)",

  radiusSm: 10,
  radiusMd: 14,
  radiusFull: 999,
} as const;

/* ═══════════════════════════════════════════════════════════════════════
 * FLASHCARD DATA MODEL — this matches the app's existing Flashcard type
 * exactly and is NOT modified. Every piece of gameplay logic below is
 * built on top of this shape only.
 * ═══════════════════════════════════════════════════════════════════════ */
export type CardStatus = "review" | "understood";

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  status: CardStatus;
}

/* ----------------------------- Other types ----------------------------- */

export interface StudySet {
  id: string;
  name: string;
  subtitle?: string;
}

interface SpaceBackgroundProps {
  starCount?: number;
  shootingStars?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  shipSize?: number;

  onBack?: () => void;

  studySets?: StudySet[];
  currentStudySetId?: string;
  onSelectStudySet?: (set: StudySet) => void;

  // The flashcards that drive the whole game. One card = one question
  // (`card.question`) with exactly one correct answer (`card.answer`).
  // Floating answer bubbles are ALWAYS pulled from other cards' `answer`
  // fields — never invented — see AnswerPool below.
  flashcards?: FlashCard[];

  // Minimum number of flashcards required to start the game. Defaults to
  // 10. If there aren't enough, a modal is shown instead of the game.
  minFlashcards?: number;

  // Called when the player taps "Go to Library" on the not-enough-cards
  // modal. If omitted, the default behavior is to navigate to the
  // Library tab (`/(tabs)/library`).
  onGoToLibrary?: () => void;

  onAnswer?: (cardId: string, correct: boolean, answerText: string) => void;

  // Called when the player finishes every flashcard, right when the
  // "You Win" modal's OK button is pressed. If omitted, the default
  // behavior is to navigate back to the game tab (`/(tabs)/game`).
  onWin?: () => void;

  // Number of hearts/lives the player starts with. Each wrong answer
  // grays one out; when all are gone the Game Over modal appears.
  maxLives?: number;

  // Called when the player runs out of lives, right when the Game Over
  // modal's OK button is pressed. If omitted, the default behavior is
  // to navigate back to the game tab (`/(tabs)/game`), same as onWin.
  onGameOver?: () => void;

  maxBullets?: number;
  fireCooldownMs?: number;

  // Set this to true while the caller is still fetching/hydrating the
  // `flashcards` prop from its own source (network, storage, etc). The
  // game will keep showing the loading spinner — on top of its own
  // image-asset preloading — until this flips back to false. Optional;
  // defaults to false, meaning "loading" is driven by asset preload only.
  isDataLoading?: boolean;

  children?: React.ReactNode;
}

interface StarConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  maxOpacity: number;
}

interface SpaceObject {
  id: number;
  x: number;
  y: number;
  size: number;
  animX: Animated.Value;
  animY: Animated.Value;
  stop: () => void;
  label: string;
  isCorrect: boolean;
  laneIndex: number;
  ampX: number;
  ampY: number;
}

interface Bullet {
  id: number;
  anim: Animated.ValueXY;
}

// A one-shot explosion effect spawned wherever a bubble was just hit.
// It lives entirely independently of the SpaceObject it replaces — once
// spawned it animates and removes itself, regardless of what the answer
// board does afterward.
interface Explosion {
  id: number;
  x: number;
  y: number;
  size: number;
  variant: HitState;
}

type HitState = "correct" | "wrong";
type HitStatesMap = Record<number, HitState>;

const NUM_SHOOTING_STAR_SLOTS = 2;
const SHIP_DEFAULT_SIZE = 160;
const BULLET_SPEED = 700;
const HEADER_HEIGHT = 56;
const QUESTION_CARD_HEIGHT = 92;
const QUESTION_CARD_MARGIN = 12;

const ANSWER_OBJECT_SIZE = 90;

// Quizlet-Blast-style floating answers: only a handful of real answers
// (pulled from the whole flashcard bank) float at once — never made-up
// distractors, and never the full deck at a time.
const FLOATING_ANSWER_MIN = 4;
const FLOATING_ANSWER_MAX = 5;

// The player needs at least this many flashcards for the answer pool to
// have enough real distractors to feel varied.
const MIN_FLASHCARDS_REQUIRED = 10;

// How many recently-shown answers the pool avoids immediately re-using,
// so the same distractor doesn't reappear round after round.
const RECENT_ANSWER_HISTORY_SIZE = 6;

interface RockPalette {
  colors: [string, string];
  glow: string;
  border: string;
  craterColor: string;
}

const ROCK_PALETTES: RockPalette[] = [
  {
    colors: ["#7A5FBF", "#2E1F52"],
    glow: "rgba(155,110,255,0.45)",
    border: "#B29CFF",
    craterColor: "rgba(20,10,40,0.55)",
  },
  {
    colors: ["#6B6F4A", "#26281A"],
    glow: "rgba(200,200,120,0.35)",
    border: "#9BA06A",
    craterColor: "rgba(10,10,5,0.55)",
  },
  {
    colors: ["#C97A46", "#5A2C14"],
    glow: "rgba(255,150,80,0.4)",
    border: "#E0A56B",
    craterColor: "rgba(35,15,5,0.55)",
  },
  {
    colors: ["#5C6B70", "#1C2528"],
    glow: "rgba(160,200,210,0.3)",
    border: "#8CA3A9",
    craterColor: "rgba(5,10,12,0.55)",
  },
];

const FLOAT_MIN_DURATION = 2200;
const FLOAT_MAX_DURATION = 3800;
const FLOAT_AMPLITUDE_Y = 14;
const FLOAT_AMPLITUDE_X = 10;



let objectIdCounter = 0;
let bulletIdCounter = 0;
let explosionIdCounter = 0;

// One explosion asset per outcome, plus the spaceship — swap these for
// your actual files. All three are preloaded up front (see
// GAME_IMAGE_ASSETS + the asset-loading effect below) so nothing pops in
// blank the first time it's asked to render.
const EXPLOSION_IMAGE_CORRECT = require("@/assets/images/explosion-correct.png");
const EXPLOSION_IMAGE_WRONG = require("@/assets/images/explosion-wrong.png");
const SPACESHIP_IMAGE = require("@/assets/images/spaceship.png");
const EXPLOSION_DURATION_MS = 380;

// Every image module the game needs on screen. Passed to
// `Asset.loadAsync` on mount so the underlying bitmaps are downloaded/
// decoded before the game is allowed to start — this is what fixes the
// "explosion doesn't render the first time" issue, which happens when an
// <Image source={require(...)}> is asked to draw before RN has finished
// resolving/caching that asset.
const GAME_IMAGE_ASSETS = [
  EXPLOSION_IMAGE_CORRECT,
  EXPLOSION_IMAGE_WRONG,
  SPACESHIP_IMAGE,
];

/* ═══════════════════════════════════════════════════════════════════════
 * RANDOMIZATION HELPERS
 * ═══════════════════════════════════════════════════════════════════════ */

/** Classic Fisher-Yates shuffle. Returns a new array, uniform distribution. */
function fisherYatesShuffle<T>(input: T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * AnswerPool — efficient, stateful distractor picker.
 *
 * Design goals (see task spec §8):
 *  - No brute-force `array.filter(...).sort(() => Math.random() - 0.5)`
 *    over the WHOLE flashcard list on every pick (that's O(n log n) per
 *    bubble, every time a bubble is destroyed — doesn't scale to
 *    thousands of cards).
 *  - Instead: pre-shuffle a flat index pool once (Fisher-Yates, O(n)),
 *    then hand out indices with a simple moving cursor (O(1) amortized
 *    per pick). The pool is only reshuffled again once the cursor runs
 *    off the end, so a full deck is only touched O(1) times per full
 *    cycle through it, not once per pick.
 *  - A small bounded "recently used" queue (Set + array acting as a
 *    ring buffer) prevents an answer from reappearing immediately after
 *    being shown, without needing to scan history on every pick.
 */
class AnswerPool {
  private cards: FlashCard[];
  private order: number[] = [];
  private cursor = 0;
  private recentQueue: string[] = [];
  private recentSet: Set<string> = new Set();
  private recentCap: number;

  constructor(cards: FlashCard[]) {
    this.cards = cards;
    this.recentCap = AnswerPool.computeRecentCap(cards.length);
    this.reshuffle();
  }

  private static computeRecentCap(cardCount: number): number {
    // Never let the "avoid repeats" window swallow the whole pool —
    // otherwise a small deck could starve and have nothing left to pick.
    return Math.max(1, Math.min(RECENT_ANSWER_HISTORY_SIZE, cardCount - 1));
  }

  private reshuffle() {
    const indices = Array.from({ length: this.cards.length }, (_, i) => i);
    this.order = fisherYatesShuffle(indices);
    this.cursor = 0;
  }

  private markRecent(answer: string) {
    if (this.recentSet.has(answer)) return;
    this.recentQueue.push(answer);
    this.recentSet.add(answer);
    while (this.recentQueue.length > this.recentCap) {
      const removed = this.recentQueue.shift();
      if (removed !== undefined) this.recentSet.delete(removed);
    }
  }

  /**
   * Swap in a fresh flashcard list (e.g. the study set changed). Resets
   * the shuffle order and recency history so nothing stale leaks across
   * decks.
   */
  updateCards(cards: FlashCard[]) {
    this.cards = cards;
    this.recentCap = AnswerPool.computeRecentCap(cards.length);
    this.recentQueue = [];
    this.recentSet.clear();
    this.reshuffle();
  }

  /**
   * Pick one distractor answer that is not in `exclude` (the answers
   * already visible on screen) and, when possible, not recently shown.
   * O(1) amortized: each call advances a cursor through a pre-shuffled
   * index array instead of re-filtering/re-sorting the whole deck.
   */
  pickDistractor(exclude: Set<string>): string | null {
    const n = this.cards.length;
    if (n === 0) return null;

    const maxAttempts = n * 2; // bounded — never spins forever
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (this.cursor >= this.order.length) this.reshuffle();
      const idx = this.order[this.cursor++];
      attempts++;

      const candidate = this.cards[idx]?.answer;
      if (!candidate) continue;
      if (exclude.has(candidate)) continue;
      if (this.recentSet.has(candidate)) continue;

      this.markRecent(candidate);
      return candidate;
    }

    // Relaxed fallback: recency window exhausted the pool (tiny decks).
    // Just guarantee uniqueness against what's currently visible.
    for (const card of this.cards) {
      if (!exclude.has(card.answer)) {
        this.markRecent(card.answer);
        return card.answer;
      }
    }

    return null; // truly nothing left (deck has 1 unique answer)
  }
}

/**
 * Choose the initial set of floating answers for a question: the
 * correct answer plus 3-4 unique distractors pulled from the pool, then
 * shuffled so the correct answer doesn't always land in the same lane.
 */
function pickInitialAnswers(
  correctAnswer: string,
  pool: AnswerPool,
  count: number,
): string[] {
  const shown = new Set<string>([correctAnswer]);
  const result = [correctAnswer];
  const wantedDistractors = Math.max(0, count - 1);

  for (let i = 0; i < wantedDistractors; i++) {
    const candidate = pool.pickDistractor(shown);
    if (candidate === null) break; // pool exhausted, keep what we have
    shown.add(candidate);
    result.push(candidate);
  }

  return fisherYatesShuffle(result);
}

function generateStars(count: number): StarConfig[] {
  return Array.from({ length: count }, (_, i) => {
    const size = Math.random() * 2 + 1;
    return {
      id: i,
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      size,
      duration: 1000 + Math.random() * 2500,
      delay: Math.random() * 3000,
      maxOpacity: 0.4 + Math.random() * 0.6,
    };
  });
}

function laneX(laneIndex: number, laneCount: number): number {
  const laneWidth = SCREEN_W / laneCount;
  const freeSpace = laneWidth - ANSWER_OBJECT_SIZE;
  const maxJitter = Math.max(0, freeSpace * 0.2);
  const jitter = (Math.random() - 0.5) * 2 * maxJitter;
  const laneCenter = laneWidth * laneIndex + laneWidth / 2;
  return laneCenter - ANSWER_OBJECT_SIZE / 2 + jitter;
}

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

function spawnAnswerInLane(
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
  const id = objectIdCounter++;

  const animX = new Animated.Value(0);
  const animY = new Animated.Value(0);

  // Difficulty scaling: a higher speedMultiplier shortens the float-loop
  // duration (faster drifting) and widens the movement amplitude a bit,
  // so later questions feel slightly more chaotic than early ones.
  const xDuration =
    (FLOAT_MIN_DURATION +
      Math.random() * (FLOAT_MAX_DURATION - FLOAT_MIN_DURATION)) /
    speedMultiplier;
  const yDuration =
    (FLOAT_MIN_DURATION +
      Math.random() * (FLOAT_MAX_DURATION - FLOAT_MIN_DURATION)) /
    speedMultiplier;

  const xDelay = Math.random() * FLOAT_MAX_DURATION;
  const yDelay = Math.random() * FLOAT_MAX_DURATION;

  const ampVariation = 0.85 + Math.random() * 0.3; // +/-15% per object
  const ampX =
    FLOAT_AMPLITUDE_X * ampVariation * Math.min(speedMultiplier, 1.4);
  const ampY =
    FLOAT_AMPLITUDE_Y * ampVariation * Math.min(speedMultiplier, 1.4);

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

  return {
    id,
    x,
    y,
    size,
    animX,
    animY,
    stop,
    label,
    isCorrect,
    laneIndex,
    ampX,
    ampY,
  };
}

function buildInitialAnswerObjects(
  correctAnswer: string,
  pool: AnswerPool,
  playAreaTop: number,
  playAreaBottom: number,
  onUpdate: (id: number, x: number, y: number) => void,
  speedMultiplier: number = 1,
): SpaceObject[] {
  if (!correctAnswer) return [];

  const count =
    FLOATING_ANSWER_MIN +
    Math.floor(
      Math.random() * (FLOATING_ANSWER_MAX - FLOATING_ANSWER_MIN + 1),
    );
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

/* ----------------------------- Star ----------------------------- */

const Star: React.FC<{ config: StarConfig }> = React.memo(({ config }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: config.maxOpacity,
          duration: config.duration,
          delay: config.delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: config.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.star,
        {
          left: config.x,
          top: config.y,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          opacity,
        },
      ]}
    />
  );
});

/* ------------------------- Shooting star ------------------------- */

const ShootingStar: React.FC<{ slotIndex: number }> = React.memo(
  ({ slotIndex }) => {
    const translateX = useRef(new Animated.Value(-100)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      let cancelled = false;
      let timeoutId: ReturnType<typeof setTimeout>;

      const runAnimation = () => {
        if (cancelled) return;

        const startX = Math.random() * SCREEN_W * 0.5;
        const startY = Math.random() * SCREEN_H * 0.4;
        const travel = 250 + Math.random() * 150;

        translateX.setValue(startX);
        translateY.setValue(startY);
        opacity.setValue(0);

        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: startX + travel,
              duration: 700,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: startY + travel * 0.5,
              duration: 700,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (cancelled) return;
          const nextDelay = 4000 + Math.random() * 6000 + slotIndex * 1500;
          timeoutId = setTimeout(runAnimation, nextDelay);
        });
      };

      const initialDelay = 1000 + slotIndex * 2000;
      timeoutId = setTimeout(runAnimation, initialDelay);

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shootingStar,
          {
            opacity,
            transform: [{ translateX }, { translateY }, { rotate: "35deg" }],
          },
        ]}
      />
    );
  },
);

/* ------------------------- Answer object (floating circle) ------------------------- */

const SpaceObjectView: React.FC<{
  obj: SpaceObject;
  hitState: "none" | HitState;
}> = React.memo(({ obj, hitState }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hitState !== "none") {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(1);
      opacity.setValue(1);
    }
  }, [hitState, scale, opacity]);

  const translateX = obj.animX.interpolate({
    inputRange: [0, 1],
    outputRange: [-obj.ampX, obj.ampX],
  });
  const translateY = obj.animY.interpolate({
    inputRange: [0, 1],
    outputRange: [-obj.ampY, obj.ampY],
  });

  const palette = ROCK_PALETTES[obj.laneIndex % ROCK_PALETTES.length];

  const isHit = hitState !== "none";
  const overlayColor =
    hitState === "correct"
      ? THEME.correctGlow
      : hitState === "wrong"
        ? THEME.wrongGlow
        : "transparent";
  const borderColor =
    hitState === "correct"
      ? THEME.correct
      : hitState === "wrong"
        ? THEME.wrong
        : palette.border;
  const shadowColor = isHit
    ? hitState === "correct"
      ? THEME.correct
      : THEME.wrong
    : palette.glow;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spaceObject,
        {
          left: obj.x,
          top: obj.y,
          width: obj.size,
          height: obj.size,
          borderRadius: obj.size / 2,
          borderColor,
          shadowColor,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0.25, y: 0.2 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.rockGradient,
          { width: obj.size, height: obj.size, borderRadius: obj.size / 2 },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.size * 0.22,
              height: obj.size * 0.22,
              borderRadius: obj.size * 0.11,
              top: obj.size * 0.18,
              left: obj.size * 0.62,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.size * 0.15,
              height: obj.size * 0.15,
              borderRadius: obj.size * 0.075,
              top: obj.size * 0.6,
              left: obj.size * 0.18,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.size * 0.12,
              height: obj.size * 0.12,
              borderRadius: obj.size * 0.06,
              top: obj.size * 0.68,
              left: obj.size * 0.6,
            },
          ]}
        />

        {isHit && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: overlayColor,
                borderRadius: obj.size / 2,
              },
            ]}
          />
        )}

        <Text style={styles.spaceObjectLabel} numberOfLines={3}>
          {obj.label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
});

/* ------------------------------- Bullet ------------------------------- */

const BulletView: React.FC<{ bullet: Bullet }> = React.memo(({ bullet }) => (
  <Animated.View
    pointerEvents="none"
    style={[styles.bullet, { transform: bullet.anim.getTranslateTransform() }]}
  />
));

/* ------------------------------ Explosion ------------------------------ */

// Plays once at the spot a bubble was destroyed, then calls `onDone` so
// the parent can drop it from state. Fully decoupled from the answer
// board — it doesn't matter that the SpaceObject it's covering for has
// already been removed.
const ExplosionView: React.FC<{
  explosion: Explosion;
  onDone: (id: number) => void;
}> = React.memo(({ explosion, onDone }) => {
  const scale = useRef(new Animated.Value(0.35)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.3,
        duration: EXPLOSION_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXPLOSION_DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone(explosion.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.explosion,
        {
          left: explosion.x,
          top: explosion.y,
          width: explosion.size,
          height: explosion.size,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Image
        source={
          explosion.variant === "correct"
            ? EXPLOSION_IMAGE_CORRECT
            : EXPLOSION_IMAGE_WRONG
        }
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </Animated.View>
  );
});

/* ------------------------------ Loading spinner ------------------------------ */

// Small themed ring spinner used on the loading overlay while assets
// (and, optionally, the caller's own data) are still loading. Purely
// decorative/animated — no gameplay dependency.
const LoadingSpinner: React.FC = React.memo(() => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]}
    />
  );
});

/* ---------------------------- Main component ---------------------------- */

const PLACEHOLDER_CARD: FlashCard = {
  id: "__placeholder__",
  question: "",
  answer: "",
  status: "review",
};

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
  starCount = 80,
  shootingStars = true,
  backgroundColor = THEME.bg,
  style,
  shipSize = SHIP_DEFAULT_SIZE,
  onBack,
  studySets = [],
  currentStudySetId,
  onSelectStudySet,
  flashcards = [],
  minFlashcards = MIN_FLASHCARDS_REQUIRED,
  onGoToLibrary,
  onAnswer,
  onWin,
  maxLives = 3,
  onGameOver,
  maxBullets = 5,
  fireCooldownMs = 220,
  isDataLoading = false,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isTablet = Device.deviceType === Device.DeviceType.TABLET;

  const stars = useMemo(() => generateStars(starCount), [starCount]);

  const questionCardBottom = insets.bottom + 16;

  const SHIP_OVERLAP = isTablet ? shipSize * 0.31 : shipSize * 0.75;

  const shipBottomOffset =
    questionCardBottom + QUESTION_CARD_HEIGHT - SHIP_OVERLAP;

  const shipX = SCREEN_W / 2 - shipSize / 2;

  const shipY = SCREEN_H - shipSize - shipBottomOffset;

  const topSafeZone = insets.top + HEADER_HEIGHT + QUESTION_CARD_MARGIN;
  const bottomSafeZone = shipY - QUESTION_CARD_MARGIN;

  /* ---------------- Asset preloading ---------------- */

  // Nothing in the game (ship, explosions) is allowed to render/animate
  // until every image asset has actually finished loading. This is what
  // fixes explosions failing to appear the very first time the game is
  // opened — on a cold start, an <Image source={require(...)}> can be
  // asked to draw before RN/Expo has resolved & cached that asset, so we
  // explicitly wait for `Asset.loadAsync` to resolve before showing
  // anything. If the caller also needs time to fetch/hydrate the
  // `flashcards` prop from elsewhere, pass `isDataLoading` and the same
  // spinner will keep covering the screen until that's done too.
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Asset.loadAsync(GAME_IMAGE_ASSETS)
      .catch((err) => {
        // Don't hard-block the game forever if preloading itself fails
        // (e.g. offline first launch with assets not yet cached) — log
        // it and let the game proceed; the images will just lazily load
        // as before in that edge case.
        console.warn("SpaceBackground: failed to preload game assets", err);
      })
      .finally(() => {
        if (!cancelled) setAssetsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Single source of truth for "is it safe to show/play the game yet".
  const isReady = assetsReady && !isDataLoading;

  /* ---------------- Flashcard validation (task spec §2) ---------------- */

  const hasEnoughCards = flashcards.length >= minFlashcards;

  const [showMinCardsModal, setShowMinCardsModal] = useState(
    !hasEnoughCards,
  );
  useEffect(() => {
    setShowMinCardsModal(!hasEnoughCards);
  }, [hasEnoughCards]);

  const handleGoToLibrary = useCallback(() => {
    if (onGoToLibrary) {
      onGoToLibrary();
      return;
    }
    router.replace("/(tabs)/library");
  }, [onGoToLibrary, router]);

  /* ---------------- Quiz progression (flashcard deck) ---------------- */

  // A cheap fingerprint so we can tell when the *whole deck* changed
  // (e.g. parent swapped in a new study set) vs. just re-rendered.
  const flashcardsKey = useMemo(
    () => flashcards.map((c) => c.id).join("|"),
    [flashcards],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);

  // Lives/hearts: 3 (or `maxLives`) to start, one turns gray per wrong
  // answer. `livesRef` mirrors the state synchronously so the delayed
  // (setTimeout) hit-resolution logic below can read the up-to-date
  // value without waiting for a re-render.
  const [lives, setLives] = useState(maxLives);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const livesRef = useRef(lives);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  // The answer pool is the single source of truth for every distractor
  // shown in the game — see AnswerPool above. It's created once and
  // mutated in place (not rebuilt on every render) for efficiency.
  const answerPoolRef = useRef<AnswerPool>(new AnswerPool(flashcards));

  // Play order: a shuffled sequence of indices into `flashcards`, so the
  // question order is randomized per session instead of always following
  // the array's natural order. `currentIndex` walks through THIS array,
  // and `playOrderRef.current[currentIndex]` gives the actual flashcard
  // index. Built once per deck (Fisher-Yates, O(n)) and re-shuffled only
  // when the deck itself changes — never recomputed on every render.
  const playOrderRef = useRef<number[]>(
    fisherYatesShuffle(flashcards.map((_, i) => i)),
  );

  const prevDeckKeyRef = useRef(flashcardsKey);
  useEffect(() => {
    if (prevDeckKeyRef.current === flashcardsKey) return;
    prevDeckKeyRef.current = flashcardsKey;
    answerPoolRef.current.updateCards(flashcards);
    playOrderRef.current = fisherYatesShuffle(flashcards.map((_, i) => i));
    setCurrentIndex(0);
    setShowWinModal(false);
    setShowGameOverModal(false);
    setLives(maxLives);
  }, [flashcardsKey, flashcards, maxLives]);

  const safeIndex =
    flashcards.length > 0
      ? Math.min(currentIndex, flashcards.length - 1)
      : 0;
  const currentCardIndex = playOrderRef.current[safeIndex] ?? safeIndex;
  const currentCard = flashcards[currentCardIndex] ?? PLACEHOLDER_CARD;
  const isLastCard = safeIndex >= flashcards.length - 1;
  const currentCorrectAnswer = currentCard.answer;

  // Difficulty scaling: floats get modestly faster/more erratic as the
  // player advances through the deck, capped so it never gets unreadable.
  const speedMultiplier = useMemo(
    () => Math.min(1 + safeIndex * 0.08, 1.8),
    [safeIndex],
  );

  const laneCountRef = useRef<number>(FLOATING_ANSWER_MIN);

  const objectPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const updateObjectPos = useCallback((id: number, x: number, y: number) => {
    objectPosRef.current.set(id, { x, y });
  }, []);

  // Objects start empty and are only populated once the game is actually
  // allowed to start (see the "gameInitializedRef" effect below) — this
  // keeps the very first floating answers (and their animations) from
  // spinning up before assets/data have finished loading.
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const objectsRef = useRef<SpaceObject[]>(objects);
  useEffect(() => {
    objectsRef.current = objects;
    laneCountRef.current = objects.length > 0 ? objects.length : FLOATING_ANSWER_MIN;
  }, [objects]);

  // Fires exactly once, the moment the game first becomes ready to play
  // (assets loaded + enough cards) — builds the first round of floating
  // answers. Guarded so it never re-runs on ordinary re-renders.
  const gameInitializedRef = useRef(false);
  useEffect(() => {
    if (!isReady || !hasEnoughCards || gameInitializedRef.current) return;
    gameInitializedRef.current = true;

    setObjects(
      buildInitialAnswerObjects(
        currentCorrectAnswer,
        answerPoolRef.current,
        topSafeZone,
        bottomSafeZone,
        updateObjectPos,
        speedMultiplier,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hasEnoughCards]);

  // When a correct hit advances the question internally (inside
  // fireBullet's setTimeout), we handle the board update ourselves —
  // swapping out just the hit circle rather than rebuilding everything.
  // This ref tells the "card changed" effect below to skip its own full
  // board rebuild for that one transition, so it doesn't stomp on the
  // surgical update. It still fires a full rebuild for any other cause
  // of a card change (e.g. a brand-new deck being loaded).
  const skipNextCardResetRef = useRef(false);

  const cardIdRef = useRef<string>(currentCard.id);
  useEffect(() => {
    if (cardIdRef.current === currentCard.id) return;
    cardIdRef.current = currentCard.id;

    if (skipNextCardResetRef.current) {
      // Already handled inline by the correct-answer hit logic — the
      // replacement bubble for this card is already on the board.
      skipNextCardResetRef.current = false;
      return;
    }

    if (!hasEnoughCards || !isReady) return;

    objectsRef.current.forEach((o) => o.stop());
    objectPosRef.current.clear();
    setObjects(
      buildInitialAnswerObjects(
        currentCorrectAnswer,
        answerPoolRef.current,
        topSafeZone,
        bottomSafeZone,
        updateObjectPos,
        speedMultiplier,
      ),
    );
    setHitStates({});
  }, [
    currentCard,
    currentCorrectAnswer,
    hasEnoughCards,
    isReady,
    speedMultiplier,
    topSafeZone,
    bottomSafeZone,
    updateObjectPos,
  ]);

  useEffect(() => {
    return () => {
      objectsRef.current.forEach((o) => o.stop());
    };
  }, []);

  const [hitStates, setHitStates] = useState<HitStatesMap>({});
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const handleExplosionDone = useCallback((id: number) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const [internalSetId, setInternalSetId] = useState<string | undefined>(
    currentStudySetId ?? studySets[0]?.id,
  );
  const activeSetId = currentStudySetId ?? internalSetId;
  const currentStudySet = studySets.find((s) => s.id === activeSetId);

  const goToGameTab = useCallback(() => {
    router.replace("/(tabs)/game");
  }, [router]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.replace("/(tabs)/game");
    } else {
      router.replace("/");
    }
  }, [onBack, router]);

  const handleOpenFolderPicker = useCallback(() => {
    router.replace({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/SpaceBlast" }
    });
  }, [router]);

  const handleWinModalOk = useCallback(() => {
    setShowWinModal(false);
    if (onWin) {
      onWin();
      return;
    }
    goToGameTab();
  }, [onWin, goToGameTab]);

  const handleGameOverOk = useCallback(() => {
    setShowGameOverModal(false);
    if (onGameOver) {
      onGameOver();
      return;
    }
    goToGameTab();
  }, [onGameOver, goToGameTab]);

  const lastFireTimeRef = useRef<number>(0);
  const activeBulletCountRef = useRef<number>(0);

  const blockInput =
    showWinModal ||
    showGameOverModal ||
    showMinCardsModal ||
    !hasEnoughCards ||
    !isReady;

  const fireBullet = useCallback(
    (targetX: number, targetY: number, hitObject?: SpaceObject) => {
      if (blockInput) return;

      const now = Date.now();
      if (now - lastFireTimeRef.current < fireCooldownMs) return;
      if (activeBulletCountRef.current >= maxBullets) return;

      lastFireTimeRef.current = now;
      activeBulletCountRef.current += 1;

      const startX = shipX + shipSize / 2 - 3;
      const startY = shipY;

      const anim = new Animated.ValueXY({ x: startX, y: startY });
      const id = bulletIdCounter++;
      const bullet: Bullet = { id, anim };

      setBullets((prev: Bullet[]) => [...prev, bullet]);

      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Math.max(150, (distance / BULLET_SPEED) * 1000);

      Animated.timing(anim, {
        toValue: { x: targetX, y: targetY },
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        activeBulletCountRef.current = Math.max(
          0,
          activeBulletCountRef.current - 1,
        );
        setBullets((prev: Bullet[]) => prev.filter((b) => b.id !== id));

        if (hitObject) {
          const result: HitState = hitObject.isCorrect ? "correct" : "wrong";
          setHitStates((prev: HitStatesMap) => ({
            ...prev,
            [hitObject.id]: result,
          }));

          // Spawn the explosion at the bubble's last known on-screen
          // position (it's still floating/animating right up to the
          // moment it's hit, so we read from objectPosRef rather than
          // hitObject's stale spawn-time x/y).
          const impactPos = objectPosRef.current.get(hitObject.id) ?? {
            x: hitObject.x,
            y: hitObject.y,
          };
          const explosionSize = hitObject.size * 1.5;
          setExplosions((prev) => [
            ...prev,
            {
              id: explosionIdCounter++,
              x: impactPos.x + hitObject.size / 2 - explosionSize / 2,
              y: impactPos.y + hitObject.size / 2 - explosionSize / 2,
              size: explosionSize,
              variant: result,
            },
          ]);

          onAnswer?.(currentCard.id, hitObject.isCorrect, hitObject.label);

          if (!hitObject.isCorrect) {
            setLives((prev) => {
              const next = Math.max(0, prev - 1);
              livesRef.current = next;
              if (next <= 0) {
                setShowGameOverModal(true);
              }
              return next;
            });
          }

          // Precompute the next card up front, since we need it inside
          // the setObjects updater below regardless of which branch runs.
          // Goes through the shuffled play order, not raw array position.
          const nextIndex = safeIndex + 1;
          const nextCardIndex = playOrderRef.current[nextIndex];
          const nextCard =
            nextCardIndex !== undefined ? flashcards[nextCardIndex] : undefined;
          const nextCorrectAnswer = nextCard?.answer ?? "";
          const nextSpeedMultiplier = Math.min(1 + nextIndex * 0.08, 1.8);

          setTimeout(() => {
            hitObject.stop();
            objectPosRef.current.delete(hitObject.id);

            setObjects((prev: SpaceObject[]) => {
              const remaining = prev.filter((o) => o.id !== hitObject.id);
              const pool = answerPoolRef.current;

              if (hitObject.isCorrect) {
                if (isLastCard) {
                  // Deck finished — clear the field and show the win modal.
                  remaining.forEach((o) => o.stop());
                  setShowWinModal(true);
                  return [];
                }

                // Only the hit circle disappears — every other bubble
                // that was already floating stays exactly where it is
                // (task spec §5/§10).
                skipNextCardResetRef.current = true;
                setCurrentIndex(nextIndex);

                const remainingLabels = new Set(remaining.map((o) => o.label));

                // Randomized-placement rule (task spec §7): the vacated
                // slot must NOT always become the next correct answer —
                // that made the freshly spawned bubble a dead giveaway
                // every single round. Instead:
                //  1. If the next correct answer already happens to be
                //     floating among the surviving distractors, the
                //     vacated slot just gets a fresh distractor.
                //  2. Otherwise, flip a coin across ALL open slots (the
                //     vacated one PLUS every bubble already on screen).
                //     Whichever slot wins gets relabeled to the correct
                //     answer; every other slot — including the vacated
                //     one, if it didn't win — gets a distractor. So the
                //     "new" bubble is only sometimes the correct one,
                //     same as any other bubble on the board.
                let replacementLabel: string;
                let replacementIsCorrect: boolean;
                let updatedRemaining = remaining;

                if (remainingLabels.has(nextCorrectAnswer)) {
                  const distractor = pool.pickDistractor(
                    new Set([...remainingLabels, nextCorrectAnswer]),
                  );
                  replacementLabel = distractor ?? hitObject.label;
                  replacementIsCorrect = false;
                } else if (remaining.length === 0) {
                  // No other bubbles to relabel — the vacated slot is the
                  // only place the correct answer can go.
                  replacementLabel = nextCorrectAnswer;
                  replacementIsCorrect = true;
                } else {
                  const slotCount = remaining.length + 1; // +1 = vacated slot
                  const chosenSlot = Math.floor(Math.random() * slotCount);

                  if (chosenSlot === remaining.length) {
                    // Vacated slot won the coin flip.
                    replacementLabel = nextCorrectAnswer;
                    replacementIsCorrect = true;
                  } else {
                    // An already-floating bubble becomes the correct
                    // answer instead; the vacated slot gets a distractor.
                    updatedRemaining = remaining.map((o, i) =>
                      i === chosenSlot
                        ? { ...o, label: nextCorrectAnswer, isCorrect: true }
                        : o,
                    );
                    const distractor = pool.pickDistractor(
                      new Set([...remainingLabels, nextCorrectAnswer]),
                    );
                    replacementLabel = distractor ?? hitObject.label;
                    replacementIsCorrect = false;
                  }
                }

                const replacement = spawnAnswerInLane(
                  replacementLabel,
                  replacementIsCorrect,
                  hitObject.laneIndex,
                  laneCountRef.current,
                  topSafeZone,
                  bottomSafeZone,
                  updateObjectPos,
                  nextSpeedMultiplier,
                );

                return [...updatedRemaining, replacement];
              }

              // Out of lives — freeze the board (the Game Over modal is
              // already up) instead of respawning another distractor.
              if (livesRef.current <= 0) {
                remaining.forEach((o) => o.stop());
                return [];
              }

              // Wrong answer shot → respawn a NEW distractor in the SAME
              // lane the destroyed one owned. The replacement is always
              // a real answer pulled from the flashcard deck's answer
              // pool (never invented), and is guaranteed unique against
              // everything currently on screen, including the current
              // question's correct answer (task spec §9).
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
                  laneCountRef.current,
                  topSafeZone,
                  bottomSafeZone,
                  updateObjectPos,
                  speedMultiplier,
                ),
              ];
            });

            setHitStates((prev: HitStatesMap) => {
              const next = { ...prev };
              delete next[hitObject.id];
              return next;
            });
          }, 220);
        }
      });
    },
    [
      blockInput,
      shipSize,
      shipX,
      shipY,
      fireCooldownMs,
      maxBullets,
      topSafeZone,
      bottomSafeZone,
      updateObjectPos,
      safeIndex,
      flashcards,
      currentCorrectAnswer,
      speedMultiplier,
      isLastCard,
      onAnswer,
    ],
  );

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      if (blockInput) return;

      const { locationX, locationY } = evt.nativeEvent;

      if (locationY < topSafeZone || locationY > bottomSafeZone) return;

      const hitObject = objects.find((obj) => {
        const currentPos = objectPosRef.current.get(obj.id) ?? {
          x: obj.x,
          y: obj.y,
        };
        const cx = currentPos.x + obj.size / 2;
        const cy = currentPos.y + obj.size / 2;
        const dist = Math.sqrt((locationX - cx) ** 2 + (locationY - cy) ** 2);
        return dist <= obj.size / 2 + 10;
      });

      if (hitObject) {
        const currentPos = objectPosRef.current.get(hitObject.id) ?? {
          x: hitObject.x,
          y: hitObject.y,
        };
        const cx = currentPos.x + hitObject.size / 2;
        const cy = currentPos.y + hitObject.size / 2;
        fireBullet(cx, cy, hitObject);
      } else {
        fireBullet(locationX, locationY);
      }
    },
    [objects, fireBullet, topSafeZone, bottomSafeZone, blockInput],
  );

  // Game visuals (floating answers, bullets, explosions, ship, hearts,
  // question HUD) only ever mount once the game is actually ready AND
  // there are enough cards to play with.
  const showGame = isReady && hasEnoughCards;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {stars.map((star) => (
        <Star key={star.id} config={star} />
      ))}

      {shootingStars &&
        Array.from({ length: NUM_SHOOTING_STAR_SLOTS }, (_, i) => (
          <ShootingStar key={i} slotIndex={i} />
        ))}

      {showGame &&
        objects.map((obj) => (
          <SpaceObjectView
            key={obj.id}
            obj={obj}
            hitState={hitStates[obj.id] ?? "none"}
          />
        ))}

      {showGame &&
        bullets.map((bullet) => <BulletView key={bullet.id} bullet={bullet} />)}

      {showGame &&
        explosions.map((explosion) => (
          <ExplosionView
            key={explosion.id}
            explosion={explosion}
            onDone={handleExplosionDone}
          />
        ))}

      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* ---------------- Spaceship ---------------- */}
      {showGame && (
        <View
          pointerEvents="none"
          style={[
            styles.ship,
            {
              width: shipSize,
              height: shipSize,
              left: shipX,
              top: shipY,
            },
          ]}
        >
          <Image
            source={SPACESHIP_IMAGE}
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* ---------------- Header ---------------- */}
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.backArrow} />
        </Pressable>

        {showGame && (
          <View style={styles.headerRightGroup} pointerEvents="box-none">
            <Pressable
              onPress={handleOpenFolderPicker}
              hitSlop={6}
              style={({ pressed }) => [
                styles.folderButton,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.folderIconSmall} />
              <Text style={styles.folderLabel} numberOfLines={1}>
                {currentStudySet ? currentStudySet.name : "change"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {showGame && (
        <>
          {/* ---------------- Lives / hearts (below the back button) ---------------- */}
          <View
            style={[styles.livesRow, { top: insets.top + 8 + HEADER_HEIGHT }]}
            pointerEvents="none"
          >
            {Array.from({ length: maxLives }, (_, i) => (
              <Text
                key={i}
                style={[styles.heartIcon, i >= lives && styles.heartIconLost]}
              >
                ♥
              </Text>
            ))}
          </View>

          {/* ---------------- Question HUD panel (green theme) ---------------- */}
          <View
            style={[
              styles.questionCard,
              { bottom: questionCardBottom, height: QUESTION_CARD_HEIGHT },
            ]}
            pointerEvents="box-none"
          >
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            <View style={[styles.cornerBracket, styles.cornerTR]} />
            <View style={[styles.cornerBracket, styles.cornerBL]} />
            <View style={[styles.cornerBracket, styles.cornerBR]} />

            <View style={styles.questionRow}>
              <View style={styles.questionBadge}>
                <View style={styles.questionBadgeDiamond} />
              </View>
              <View style={styles.questionTextBlock}>
                <View style={styles.kickerRow}>
                  <View style={styles.kickerDot} />
                  <Text style={styles.questionKicker}>
                    {flashcards.length > 1
                      ? `QUESTION ${safeIndex + 1}/${flashcards.length}`
                      : "INCOMING TRANSMISSION"}
                  </Text>
                </View>
                <Text style={styles.questionText} numberOfLines={2}>
                  {currentCard.question}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* ---------------- Not enough flashcards modal ---------------- */}
      {isReady && showMinCardsModal && (
        <View style={styles.winModalOverlay} pointerEvents="auto">
          <View style={styles.winModalCard}>
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            <View style={[styles.cornerBracket, styles.cornerTR]} />
            <View style={[styles.cornerBracket, styles.cornerBL]} />
            <View style={[styles.cornerBracket, styles.cornerBR]} />

            <View style={styles.minCardsIconWrap}>
              <View style={styles.minCardsIconCardBack} />
              <View style={styles.minCardsIconCardFront} />
            </View>

            <Text style={styles.winModalTitle}>MORE CARDS NEEDED</Text>
            <Text style={styles.winModalSubtitle}>
              You need at least {minFlashcards} flashcards to play this
              game. More flashcards are required so the game has enough
              answer choices.{"\n\n"}
              You currently have {flashcards.length}.
            </Text>

            <Pressable
              onPress={handleGoToLibrary}
              style={({ pressed }) => [
                styles.winModalButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.winModalButtonText}>Go to Library</Text>
            </Pressable>

            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.minCardsSecondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.minCardsSecondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ---------------- You Win modal ---------------- */}
      {showWinModal && (
        <View style={styles.winModalOverlay} pointerEvents="auto">
          <View style={styles.winModalCard}>
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            <View style={[styles.cornerBracket, styles.cornerTR]} />
            <View style={[styles.cornerBracket, styles.cornerBL]} />
            <View style={[styles.cornerBracket, styles.cornerBR]} />

            <View style={styles.winModalBadge}>
              <View style={styles.questionBadgeDiamond} />
            </View>
            <Text style={styles.winModalTitle}>YOU WIN!</Text>
            <Text style={styles.winModalSubtitle}>
              You answered all {flashcards.length}{" "}
              {flashcards.length === 1 ? "question" : "questions"}{" "}
              correctly.
            </Text>

            <Pressable
              onPress={handleWinModalOk}
              style={({ pressed }) => [
                styles.winModalButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.winModalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ---------------- Game Over modal ---------------- */}
      {showGameOverModal && (
        <View style={styles.winModalOverlay} pointerEvents="auto">
          <View style={[styles.winModalCard, styles.gameOverCard]}>
            <View
              style={[styles.cornerBracket, styles.cornerTL, styles.cornerDanger]}
            />
            <View
              style={[styles.cornerBracket, styles.cornerTR, styles.cornerDanger]}
            />
            <View
              style={[styles.cornerBracket, styles.cornerBL, styles.cornerDanger]}
            />
            <View
              style={[styles.cornerBracket, styles.cornerBR, styles.cornerDanger]}
            />

            <View style={[styles.winModalBadge, styles.gameOverBadge]}>
              <Text style={styles.gameOverBadgeIcon}>♥</Text>
            </View>
            <Text style={[styles.winModalTitle, styles.gameOverTitle]}>
              GAME OVER
            </Text>
            <Text style={styles.winModalSubtitle}>
              You ran out of lives. Give it another shot!
            </Text>

            <Pressable
              onPress={handleGameOverOk}
              style={({ pressed }) => [
                styles.winModalButton,
                styles.gameOverButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.winModalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ---------------- Loading overlay ---------------- */}
      {/* Sits above everything else (highest zIndex) until assets (and, if
          `isDataLoading` is passed, the caller's own data) are ready. This
          is what prevents the player from ever seeing a blank/broken
          explosion frame on a cold first launch. */}
      {!isReady && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <LoadingSpinner />
          <Text style={styles.loadingTitle}>PREPARING MISSION</Text>
          <Text style={styles.loadingSubtitle}>Loading assets…</Text>
        </View>
      )}

      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
  shootingStar: {
    position: "absolute",
    width: 90,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  spaceObject: {
    position: "absolute",
    borderWidth: 2,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  rockGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  crater: {
    position: "absolute",
  },
  spaceObjectLabel: {
    color: THEME.textWhite,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },

  bullet: {
    position: "absolute",
    left: -3,
    top: 0,
    width: 6,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#ffe066",
    shadowColor: "#ffe066",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  explosion: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },

  ship: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 16,
  },
  shipBody: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 34,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#4fd1ff",
  },
  shipThruster: {
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffb84d",
    marginTop: -2,
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: HEADER_HEIGHT + 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    width: 11,
    height: 11,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    borderColor: "#ffffff",
    transform: [{ rotate: "45deg" }],
    marginLeft: 4,
  },

  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  livesRow: {
    position: "absolute",
    left: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  heartIcon: {
    fontSize: 30,
    lineHeight: 32,
    marginRight: 5,
    color: THEME.wrong,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartIconLost: {
    color: THEME.textMuted,
  },

  folderButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 12,
    maxWidth: SCREEN_W * 0.62,
  },
  folderIconSmall: {
    width: 16,
    height: 12,
    backgroundColor: THEME.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  folderLabel: {
    color: THEME.textWhite,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },

  questionCard: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 15,
    backgroundColor: THEME.panelBg,
    borderWidth: 1,
    borderColor: THEME.panelBorder,
    borderRadius: THEME.radiusMd,
    padding: 14,
    justifyContent: "center",
    shadowColor: THEME.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  cornerBracket: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: THEME.primary,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderBottomRightRadius: 6,
  },
  cornerDanger: {
    borderColor: THEME.wrong,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  questionBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  questionBadgeDiamond: {
    width: 10,
    height: 10,
    backgroundColor: THEME.primary,
    transform: [{ rotate: "45deg" }],
  },
  questionTextBlock: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  kickerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME.primary,
    marginRight: 6,
  },
  questionKicker: {
    color: THEME.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  questionText: {
    color: THEME.textWhite,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },

  winModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: THEME.overlayBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  winModalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: THEME.panelBg,
    borderWidth: 1,
    borderColor: THEME.panelBorder,
    borderRadius: THEME.radiusMd,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: THEME.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  winModalBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  winModalTitle: {
    color: THEME.textWhite,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  winModalSubtitle: {
    color: THEME.textMid,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 22,
  },
  winModalButton: {
    width: "100%",
    height: 46,
    borderRadius: THEME.radiusFull,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  winModalButtonText: {
    color: THEME.bg,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  gameOverCard: {
    borderColor: THEME.wrongGlow,
    shadowColor: THEME.wrong,
  },
  gameOverBadge: {
    backgroundColor: THEME.wrongGlow,
    borderColor: THEME.wrong,
  },
  gameOverBadgeIcon: {
    fontSize: 20,
    color: THEME.wrong,
  },
  gameOverTitle: {
    color: THEME.wrong,
  },
  gameOverButton: {
    backgroundColor: THEME.wrong,
  },

  minCardsIconWrap: {
    width: 56,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  minCardsIconCardBack: {
    position: "absolute",
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    transform: [{ rotate: "-8deg" }, { translateX: -4 }],
  },
  minCardsIconCardFront: {
    position: "absolute",
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    transform: [{ rotate: "6deg" }, { translateX: 4 }],
  },
  minCardsSecondaryButton: {
    width: "100%",
    height: 46,
    borderRadius: THEME.radiusFull,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  minCardsSecondaryButtonText: {
    color: THEME.textMid,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: THEME.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: THEME.border,
    borderTopColor: THEME.primary,
    marginBottom: 18,
  },
  loadingTitle: {
    color: THEME.textWhite,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  loadingSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  content: {
    flex: 1,
    zIndex: 10,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: THEME.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: THEME.textMuted,
    fontSize: 16,
  },
});

interface GameContentProps {
  folderId: string;
  folderName: string;
}

const SpaceBlastGameContent: React.FC<GameContentProps> = ({ folderId, folderName }) => {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Load from local SQLite database first
  const loadCachedCards = useCallback((): FlashCard[] => {
    try {
      const dbCards = getFlashcardsByFolder(folderId) as any[];
      const mapped = dbCards.map((c) => ({
        id: String(c.id),
        question: c.question,
        answer: c.answer,
        status: (c.status as CardStatus) ?? "review",
      }));
      if (isMountedRef.current) {
        setCards(mapped);
      }
      return mapped;
    } catch (e) {
      console.error("Failed to load cached cards:", e);
      return [];
    }
  }, [folderId]);

  // Sync with backend API
  const syncFlashcards = useCallback(async () => {
    try {
      // 1. Retrieve local SQLite data first
      const local = loadCachedCards();

      // If we got cached cards, we can stop the main loading spinner early,
      // so the game is ready instantly (faster startup).
      if (local.length > 0 && isMountedRef.current) {
        setIsDataLoading(false);
      }

      // 2. Fetch the backend data
      const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`);
      if (!response.ok) {
        throw new Error("Failed to fetch from backend");
      }
      const data = await response.json();
      
      const backend: FlashCard[] = data.map((item: any) => ({
        id: String(item.id),
        question: item.question,
        answer: item.answer,
        status: (item.status as CardStatus) ?? "review",
      }));

      if (!isMountedRef.current) return;

      // 3. Compare local SQLite data with backend data
      const isSynced = (localList: FlashCard[], backendList: FlashCard[]): boolean => {
        if (localList.length !== backendList.length) return false;
        const localMap = new Map(localList.map((c) => [c.id, c]));
        for (const b of backendList) {
          const l = localMap.get(b.id);
          if (!l) return false;
          if (l.question !== b.question || l.answer !== b.answer || l.status !== b.status) {
            return false;
          }
        }
        return true;
      };

      // 4. If synchronized, use SQLite directly (nothing to do, already loaded)
      if (isSynced(local, backend)) {
        setIsDataLoading(false);
        return;
      }

      // 5. If not synchronized, update SQLite and refresh state
      replaceFlashcardsForFolder(
        folderId,
        backend.map((card) => ({ ...card, folderId })),
        "synced"
      );

      if (isMountedRef.current) {
        setCards(backend);
      }
    } catch (error) {
      console.error("Sync failed, falling back to local SQLite cache:", error);
      // Fallback is automatic since we loaded local cards first
    } finally {
      if (isMountedRef.current) {
        setIsDataLoading(false);
      }
    }
  }, [folderId, loadCachedCards]);

  useEffect(() => {
    isMountedRef.current = true;
    void syncFlashcards();

    return () => {
      isMountedRef.current = false;
    };
  }, [syncFlashcards]);

  // Callback to update card status (correct / incorrect outcome)
  const handleAnswer = useCallback(
    async (cardId: string, correct: boolean, answerText: string) => {
      const newStatus: CardStatus = correct ? "understood" : "review";
      try {
        // Update local SQLite
        updateFlashcardStatus(cardId, newStatus);

        // Update React state
        setCards((prev) =>
          prev.map((card) =>
            card.id === cardId ? { ...card, status: newStatus } : card
          )
        );

        // Sync to backend
        const response = await fetch(`${BASE_URL}/flashcards/${cardId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update flashcard status on server");
        }
      } catch (error) {
        console.error("Failed to update flashcard status:", error);
      }
    },
    []
  );

  return (
    <SpaceBackground
      flashcards={cards}
      isDataLoading={isDataLoading}
      studySets={[{ id: folderId, name: folderName }]}
      currentStudySetId={folderId}
      onAnswer={handleAnswer}
    />
  );
};

const SpaceBlastScreen: React.FC = () => {
  const { folderId, folderName } = useLocalSearchParams<{ folderId: string; folderName: string }>();

  if (!folderId) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>No folder selected.</Text>
      </View>
    );
  }

  return (
    <SpaceBlastGameContent
      key={folderId}
      folderId={folderId}
      folderName={folderName ?? "Space Blast"}
    />
  );
};

export default SpaceBlastScreen;