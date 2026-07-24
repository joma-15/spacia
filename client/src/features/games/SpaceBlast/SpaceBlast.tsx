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
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";

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

/* ----------------------------- Types ----------------------------- */

export interface StudySet {
  id: string;
  name: string;
  subtitle?: string;
}

export interface Answer {
  id: string;
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
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

  // Preferred: pass the full quiz as a list. The component advances
  // through these itself — one correct hit moves to the next question,
  // and a "You Win" modal appears after the last one.
  questions?: Question[];

  // Back-compat: a single question. Only used if `questions` isn't
  // provided. In that case the component still behaves the same as
  // before — you just get a one-question "quiz".
  question?: Question;

  onAnswer?: (correct: boolean, answerId: string) => void;

  // Called when the player finishes the whole `questions` list, right
  // when the win modal's OK button is pressed. If omitted, the default
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

type HitState = "correct" | "wrong";
type HitStatesMap = Record<number, HitState>;

const NUM_SHOOTING_STAR_SLOTS = 2;
const SHIP_DEFAULT_SIZE = 160;
const BULLET_SPEED = 700;
const HEADER_HEIGHT = 56;
const QUESTION_CARD_HEIGHT = 92;
const QUESTION_CARD_MARGIN = 12;

const ANSWER_OBJECT_SIZE = 90;

// Quizlet-Blast-style floating answers: only a handful of real correct
// answers (pulled from the whole question bank) float at once — never
// made-up distractors, and never the full set of 10+ answers at a time.
const FLOATING_ANSWER_MIN = 4;
const FLOATING_ANSWER_MAX = 5;

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

const DUMMY_QUESTION: Question = {
  id: "q1",
  text: "What is the powerhouse of the cell?",
  answers: [
    { id: "a1", text: "Mitochondria", correct: true },
    { id: "a2", text: "Nucleus", correct: false },
    { id: "a3", text: "Ribosome", correct: false },
    { id: "a4", text: "Golgi Apparatus", correct: false },
  ],
};

// A 10-question dummy set so the component is playable/testable with zero
// wiring. Used automatically whenever no `questions` prop is passed. Once
// you pass your own `questions={...}`, this is ignored entirely.
const DUMMY_QUESTIONS: Question[] = [
  DUMMY_QUESTION,
  {
    id: "q2",
    text: "Which organelle packages and ships proteins?",
    answers: [
      { id: "q2a1", text: "Golgi Apparatus", correct: true },
      { id: "q2a2", text: "Lysosome", correct: false },
      { id: "q2a3", text: "Cytoplasm", correct: false },
      { id: "q2a4", text: "Vacuole", correct: false },
    ],
  },
  {
    id: "q3",
    text: "What planet is known as the Red Planet?",
    answers: [
      { id: "q3a1", text: "Mars", correct: true },
      { id: "q3a2", text: "Venus", correct: false },
      { id: "q3a3", text: "Jupiter", correct: false },
      { id: "q3a4", text: "Saturn", correct: false },
    ],
  },
  {
    id: "q4",
    text: "What is the chemical symbol for gold?",
    answers: [
      { id: "q4a1", text: "Au", correct: true },
      { id: "q4a2", text: "Ag", correct: false },
      { id: "q4a3", text: "Gd", correct: false },
      { id: "q4a4", text: "Go", correct: false },
    ],
  },
  {
    id: "q5",
    text: "Who wrote 'Romeo and Juliet'?",
    answers: [
      { id: "q5a1", text: "William Shakespeare", correct: true },
      { id: "q5a2", text: "Charles Dickens", correct: false },
      { id: "q5a3", text: "Jane Austen", correct: false },
      { id: "q5a4", text: "Mark Twain", correct: false },
    ],
  },
  {
    id: "q6",
    text: "What is the largest ocean on Earth?",
    answers: [
      { id: "q6a1", text: "Pacific Ocean", correct: true },
      { id: "q6a2", text: "Atlantic Ocean", correct: false },
      { id: "q6a3", text: "Indian Ocean", correct: false },
      { id: "q6a4", text: "Arctic Ocean", correct: false },
    ],
  },
  {
    id: "q7",
    text: "How many bones are in the adult human body?",
    answers: [
      { id: "q7a1", text: "206", correct: true },
      { id: "q7a2", text: "180", correct: false },
      { id: "q7a3", text: "220", correct: false },
      { id: "q7a4", text: "150", correct: false },
    ],
  },
  {
    id: "q8",
    text: "What gas do plants absorb from the atmosphere?",
    answers: [
      { id: "q8a1", text: "Carbon Dioxide", correct: true },
      { id: "q8a2", text: "Oxygen", correct: false },
      { id: "q8a3", text: "Nitrogen", correct: false },
      { id: "q8a4", text: "Hydrogen", correct: false },
    ],
  },
  {
    id: "q9",
    text: "What is the smallest prime number?",
    answers: [
      { id: "q9a1", text: "2", correct: true },
      { id: "q9a2", text: "0", correct: false },
      { id: "q9a3", text: "1", correct: false },
      { id: "q9a4", text: "3", correct: false },
    ],
  },
  {
    id: "q10",
    text: "Which layer of the Earth is mostly liquid iron and nickel?",
    answers: [
      { id: "q10a1", text: "Outer Core", correct: true },
      { id: "q10a2", text: "Mantle", correct: false },
      { id: "q10a3", text: "Crust", correct: false },
      { id: "q10a4", text: "Inner Core", correct: false },
    ],
  },
];

let objectIdCounter = 0;
let bulletIdCounter = 0;

/**
 * Flattens every correct answer across the whole question bank into a
 * deduplicated pool of strings. This is the *only* source floating
 * answer circles are drawn from — never randomly invented text.
 */
function buildAnswerPool(questions: Question[]): string[] {
  const seen = new Set<string>();
  const pool: string[] = [];
  questions.forEach((q) => {
    q.answers.forEach((a) => {
      if (a.correct && !seen.has(a.text)) {
        seen.add(a.text);
        pool.push(a.text);
      }
    });
  });
  return pool;
}

/**
 * Picks a small (4-5) set of answer strings to float for the current
 * question: the current correct answer is always included, and the rest
 * are randomly sampled distractors pulled from other questions' correct
 * answers (never duplicated within the set). The result is shuffled so
 * the correct answer doesn't always land in the same lane/position.
 */
function pickFloatingAnswers(
  correctText: string,
  pool: string[],
  count: number,
): string[] {
  const distractorPool = pool.filter((text) => text !== correctText);
  const shuffledDistractors = [...distractorPool].sort(
    () => Math.random() - 0.5,
  );

  const wantedDistractors = Math.max(0, count - 1);
  const chosenDistractors: string[] = [];
  const used = new Set<string>();

  for (const text of shuffledDistractors) {
    if (chosenDistractors.length >= wantedDistractors) break;
    if (used.has(text)) continue;
    used.add(text);
    chosenDistractors.push(text);
  }

  // Not enough unique distractors in the pool (e.g. a very small question
  // bank) — reuse from the pool rather than inventing fake answers.
  let i = 0;
  while (
    chosenDistractors.length < wantedDistractors &&
    distractorPool.length > 0
  ) {
    chosenDistractors.push(distractorPool[i % distractorPool.length]);
    i++;
  }

  const result = [correctText, ...chosenDistractors];
  return result.sort(() => Math.random() - 0.5);
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

function buildAnswerObjectsFromPool(
  correctText: string,
  pool: string[],
  playAreaTop: number,
  playAreaBottom: number,
  onUpdate: (id: number, x: number, y: number) => void,
  speedMultiplier: number = 1,
): SpaceObject[] {
  const count =
    FLOATING_ANSWER_MIN +
    Math.floor(
      Math.random() * (FLOATING_ANSWER_MAX - FLOATING_ANSWER_MIN + 1),
    );
  const texts = pickFloatingAnswers(correctText, pool, count);
  return texts.map((text, laneIndex) =>
    spawnAnswerInLane(
      text,
      text === correctText,
      laneIndex,
      texts.length,
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

/* ---------------------------- Main component ---------------------------- */

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
  questions,
  question = DUMMY_QUESTION,
  onAnswer,
  onWin,
  maxLives = 3,
  onGameOver,
  maxBullets = 5,
  fireCooldownMs = 220,
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

  /* ---------------- Quiz progression (list of questions) ---------------- */

  // Prefer the `questions` list; fall back to the single `question` prop
  // so existing single-question usage keeps working unchanged.
  const questionList = useMemo<Question[]>(() => {
    if (questions && questions.length > 0) return questions;
    // No `questions` prop passed at all — use the 10-question dummy set so
    // the game is playable out of the box. (An explicit single `question`
    // prop, if passed without `questions`, still wins over the dummy set.)
    if (question !== DUMMY_QUESTION) return [question];
    return DUMMY_QUESTIONS;
  }, [questions, question]);

  // A cheap fingerprint so we can tell when the *whole quiz* changed
  // (e.g. parent swapped in a new study set) vs. just re-rendered.
  const questionListKey = useMemo(
    () => questionList.map((q) => q.id).join("|"),
    [questionList],
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

  const prevListKeyRef = useRef(questionListKey);
  useEffect(() => {
    if (prevListKeyRef.current === questionListKey) return;
    prevListKeyRef.current = questionListKey;
    setCurrentIndex(0);
    setShowWinModal(false);
    setShowGameOverModal(false);
    setLives(maxLives);
  }, [questionListKey, maxLives]);

  const safeIndex = Math.min(currentIndex, questionList.length - 1);
  const currentQuestion = questionList[safeIndex] ?? DUMMY_QUESTION;
  const isLastQuestion = safeIndex >= questionList.length - 1;

  // Quizlet-Blast-style answer pool: every correct answer across the whole
  // question bank, deduplicated. This is the only source floating answer
  // circles are drawn from — never randomly invented text.
  const answerPool = useMemo(
    () => buildAnswerPool(questionList),
    [questionList],
  );

  const currentCorrectAnswer = useMemo(() => {
    const correct = currentQuestion.answers.find((a) => a.correct);
    return correct ? correct.text : (currentQuestion.answers[0]?.text ?? "");
  }, [currentQuestion]);

  // Difficulty scaling: floats get modestly faster/more erratic as the
  // player advances through the question list, capped so it never gets
  // unreadable.
  const speedMultiplier = useMemo(
    () => Math.min(1 + safeIndex * 0.08, 1.8),
    [safeIndex],
  );

  const laneCountRef = useRef<number>(currentQuestion.answers.length);
  useEffect(() => {
    laneCountRef.current = currentQuestion.answers.length;
  }, [currentQuestion]);

  const objectPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const updateObjectPos = useCallback((id: number, x: number, y: number) => {
    objectPosRef.current.set(id, { x, y });
  }, []);

  const [objects, setObjects] = useState<SpaceObject[]>(() =>
    buildAnswerObjectsFromPool(
      currentCorrectAnswer,
      answerPool,
      topSafeZone,
      bottomSafeZone,
      updateObjectPos,
      speedMultiplier,
    ),
  );
  const objectsRef = useRef<SpaceObject[]>(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  const questionIdRef = useRef<string>(currentQuestion.id);
  useEffect(() => {
    if (questionIdRef.current === currentQuestion.id) return;
    questionIdRef.current = currentQuestion.id;
    objectsRef.current.forEach((o) => o.stop());
    objectPosRef.current.clear();
    setObjects(
      buildAnswerObjectsFromPool(
        currentCorrectAnswer,
        answerPool,
        topSafeZone,
        bottomSafeZone,
        updateObjectPos,
        speedMultiplier,
      ),
    );
    setHitStates({});
  }, [
    currentQuestion,
    currentCorrectAnswer,
    answerPool,
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
    // TODO: point this at your actual study-set picker screen/route
    router.replace("/games/SelectionWizard");
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

  const fireBullet = useCallback(
    (targetX: number, targetY: number, hitObject?: SpaceObject) => {
      if (showWinModal || showGameOverModal) return;

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

          onAnswer?.(hitObject.isCorrect, hitObject.label);

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

          setTimeout(() => {
            hitObject.stop();
            objectPosRef.current.delete(hitObject.id);

            setObjects((prev: SpaceObject[]) => {
              const remaining = prev.filter((o) => o.id !== hitObject.id);

              if (hitObject.isCorrect) {
                // Correct answer shot: clear the field. If there's another
                // question queued up, advance to it — the questionIdRef
                // effect above will notice currentQuestion changed and
                // spawn a fresh set of floating answers. If this was the
                // last question, show the win modal instead.
                remaining.forEach((o) => o.stop());

                if (isLastQuestion) {
                  setShowWinModal(true);
                } else {
                  setCurrentIndex((idx) => idx + 1);
                }

                return [];
              }

              // Out of lives — freeze the board (the Game Over modal is
              // already up) instead of respawning another distractor.
              if (livesRef.current <= 0) {
                remaining.forEach((o) => o.stop());
                return [];
              }

              // Wrong answer shot → respawn a NEW distractor in the SAME
              // lane the destroyed one owned. The replacement is always a
              // real correct answer pulled from the global answer pool
              // (never an invented answer), avoiding whatever's already
              // floating and the current question's correct answer.
              const shownLabels = new Set(remaining.map((o) => o.label));
              const availableDistractors = answerPool.filter(
                (text) =>
                  text !== currentCorrectAnswer && !shownLabels.has(text),
              );
              const distractorSource =
                availableDistractors.length > 0
                  ? availableDistractors
                  : answerPool.filter(
                      (text) => text !== currentCorrectAnswer,
                    );
              const replacementText =
                distractorSource[
                  Math.floor(Math.random() * distractorSource.length)
                ] ?? hitObject.label;

              return [
                ...remaining,
                spawnAnswerInLane(
                  replacementText,
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
      shipSize,
      shipX,
      shipY,
      fireCooldownMs,
      maxBullets,
      topSafeZone,
      bottomSafeZone,
      updateObjectPos,
      currentQuestion,
      currentCorrectAnswer,
      answerPool,
      speedMultiplier,
      isLastQuestion,
      onAnswer,
      showWinModal,
      showGameOverModal,
    ],
  );

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      if (showWinModal || showGameOverModal) return;

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
    [objects, fireBullet, topSafeZone, bottomSafeZone, showWinModal, showGameOverModal],
  );

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {stars.map((star) => (
        <Star key={star.id} config={star} />
      ))}

      {shootingStars &&
        Array.from({ length: NUM_SHOOTING_STAR_SLOTS }, (_, i) => (
          <ShootingStar key={i} slotIndex={i} />
        ))}

      {objects.map((obj) => (
        <SpaceObjectView
          key={obj.id}
          obj={obj}
          hitState={hitStates[obj.id] ?? "none"}
        />
      ))}

      {bullets.map((bullet) => (
        <BulletView key={bullet.id} bullet={bullet} />
      ))}

      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* ---------------- Spaceship ---------------- */}
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
          source={require("@/assets/images/spaceship.png")}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="contain"
        />
      </View>

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
      </View>

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
                {questionList.length > 1
                  ? `QUESTION ${safeIndex + 1}/${questionList.length}`
                  : "INCOMING TRANSMISSION"}
              </Text>
            </View>
            <Text style={styles.questionText} numberOfLines={2}>
              {currentQuestion.text}
            </Text>
          </View>
        </View>
      </View>

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
              You answered all {questionList.length}{" "}
              {questionList.length === 1 ? "question" : "questions"}{" "}
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

  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default SpaceBackground;