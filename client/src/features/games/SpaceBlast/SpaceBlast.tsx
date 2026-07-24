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

  question?: Question;
  onAnswer?: (correct: boolean, answerId: string) => void;

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
  // Static resting position — the object hovers around this point instead
  // of traveling anywhere. Motion is purely a small animated offset from
  // this base position (see animX / animY below).
  x: number;
  y: number;
  size: number;
  animX: Animated.Value;
  animY: Animated.Value;
  stop: () => void;
  label: string;
  isCorrect: boolean;
  // Which horizontal lane this object owns. Lanes are fixed, non-overlapping
  // columns — as long as at most one object occupies a lane at a time,
  // objects can never visually stack on top of each other.
  laneIndex: number;
}

interface Bullet {
  id: number;
  anim: Animated.ValueXY;
}

// Named alias instead of an inline generic — avoids the
// "useState<Record<number, ...>>" double-angle-bracket pattern that some
// clipboard/editor pipelines mangle, and gives `prev` a real type in every
// setHitStates callback instead of falling back to `any`.
type HitState = "correct" | "wrong";
type HitStatesMap = Record<number, HitState>;

const NUM_SHOOTING_STAR_SLOTS = 2;
const SHIP_DEFAULT_SIZE = 160;
const BULLET_SPEED = 700;
const HEADER_HEIGHT = 56;
const QUESTION_CARD_HEIGHT = 92;
const QUESTION_CARD_MARGIN = 12;

// Answer objects are circles this size (diameter, in px). Bumped up so the
// rocky texture/glow actually reads.
const ANSWER_OBJECT_SIZE = 100;

// Each lane cycles through one of these asteroid "species" — different
// base rock color + matching glow, echoing the mixed purple/olive/rust
// asteroids in the banner art instead of one flat theme color.
interface RockPalette {
  colors: [string, string]; // gradient: highlight -> shadow
  glow: string;
  border: string;
  craterColor: string;
}

const ROCK_PALETTES: RockPalette[] = [
  {
    // purple asteroid (like "Mitochondria" / "Ribosome" in the banner)
    colors: ["#7A5FBF", "#2E1F52"],
    glow: "rgba(155,110,255,0.45)",
    border: "#B29CFF",
    craterColor: "rgba(20,10,40,0.55)",
  },
  {
    // dark olive/stone asteroid (like "Nucleus")
    colors: ["#6B6F4A", "#26281A"],
    glow: "rgba(200,200,120,0.35)",
    border: "#9BA06A",
    craterColor: "rgba(10,10,5,0.55)",
  },
  {
    // rust/ember asteroid (echoes the orange explosion rocks)
    colors: ["#C97A46", "#5A2C14"],
    glow: "rgba(255,150,80,0.4)",
    border: "#E0A56B",
    craterColor: "rgba(35,15,5,0.55)",
  },
  {
    // slate/graphite asteroid (like "Vacuole")
    colors: ["#5C6B70", "#1C2528"],
    glow: "rgba(160,200,210,0.3)",
    border: "#8CA3A9",
    craterColor: "rgba(5,10,12,0.55)",
  },
];

// Floating motion tuning — each object gently bobs/sways around its fixed
// resting spot instead of falling. Edit these to change how "alive" the
// float feels.
const FLOAT_MIN_DURATION = 2200; // ms for one half-cycle (down/up or left/right)
const FLOAT_MAX_DURATION = 3800;
const FLOAT_AMPLITUDE_Y = 14; // px, vertical bob distance from resting spot
const FLOAT_AMPLITUDE_X = 10; // px, horizontal sway distance from resting spot

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

let objectIdCounter = 0;
let bulletIdCounter = 0;

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

/**
 * Given a lane index and the total lane count, returns the `left` x
 * position for that lane's object.
 *
 * The screen is divided into `laneCount` equal-width columns. Each object
 * is centered in its column, with a small random jitter so things don't
 * look too robotic/grid-like — but the jitter is capped at 20% of the
 * lane's free space, which mathematically guarantees the object's circle
 * never crosses into a neighboring lane. That's what makes "no stacking"
 * a guarantee rather than a probability (each lane only ever holds one
 * object, and lanes are non-overlapping columns).
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
 * Starts an infinite, gentle back-and-forth loop on an Animated.Value
 * between 0 and 1 (sine-ish ease), used to drive a small pixel offset.
 * `initialDelay` staggers the very first leg so objects don't all bob in
 * lock-step.
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
 * THE single source of truth for spawning a floating answer.
 *
 * Every answer object — whether it's part of the initial batch for a new
 * question, or a replacement spawned after a wrong answer gets shot —
 * goes through this exact function. The object gets a fixed resting
 * position (x from its lane, y randomized within the play area) and then
 * hovers there via small animated x/y offsets — it never travels anywhere
 * beyond that.
 */
function spawnAnswerInLane(
  label: string,
  isCorrect: boolean,
  laneIndex: number,
  laneCount: number,
  playAreaTop: number,
  playAreaBottom: number,
  onUpdate: (id: number, x: number, y: number) => void,
): SpaceObject {
  const size = ANSWER_OBJECT_SIZE;
  const x = laneX(laneIndex, laneCount);
  const usableHeight = Math.max(0, playAreaBottom - playAreaTop - size);
  const y = playAreaTop + Math.random() * usableHeight;
  const id = objectIdCounter++;

  const animX = new Animated.Value(0);
  const animY = new Animated.Value(0);

  const xDuration =
    FLOAT_MIN_DURATION +
    Math.random() * (FLOAT_MAX_DURATION - FLOAT_MIN_DURATION);
  const yDuration =
    FLOAT_MIN_DURATION +
    Math.random() * (FLOAT_MAX_DURATION - FLOAT_MIN_DURATION);

  const xDelay = Math.random() * FLOAT_MAX_DURATION;
  const yDelay = Math.random() * FLOAT_MAX_DURATION;

  let currentX = x;
  let currentY = y;

  const toOffset = (amp: number, value: number) => -amp + value * 2 * amp;

  onUpdate(id, currentX, currentY);

  const listenerIdX = animX.addListener(({ value }) => {
    currentX = x + toOffset(FLOAT_AMPLITUDE_X, value);
    onUpdate(id, currentX, currentY);
  });
  const listenerIdY = animY.addListener(({ value }) => {
    currentY = y + toOffset(FLOAT_AMPLITUDE_Y, value);
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
  };
}

/**
 * Builds the full set of floating answer objects for a question: one
 * object per answer, each permanently assigned to its own lane
 * (0..answers.length-1), each hovering at its own resting spot within the
 * visible play area.
 */
function buildAnswerObjects(
  question: Question,
  playAreaTop: number,
  playAreaBottom: number,
  onUpdate: (id: number, x: number, y: number) => void,
): SpaceObject[] {
  const laneCount = question.answers.length;
  // Shuffle which answer goes in which lane so the correct answer isn't
  // always in the same spot question after question.
  const shuffled = [...question.answers].sort(() => Math.random() - 0.5);
  return shuffled.map((answer, laneIndex) =>
    spawnAnswerInLane(
      answer.text,
      answer.correct,
      laneIndex,
      laneCount,
      playAreaTop,
      playAreaBottom,
      onUpdate,
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
    outputRange: [-FLOAT_AMPLITUDE_X, FLOAT_AMPLITUDE_X],
  });
  const translateY = obj.animY.interpolate({
    inputRange: [0, 1],
    outputRange: [-FLOAT_AMPLITUDE_Y, FLOAT_AMPLITUDE_Y],
  });

  // Rock species is picked by lane, so the same slot always reads as the
  // same "kind" of asteroid across a round, then hit-state colors are
  // layered on top when shot.
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
        {/* Faked crater texture — a few soft dark blobs at fixed relative
            spots. Purely decorative, doesn't affect hit-testing. */}
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
  question = DUMMY_QUESTION,
  onAnswer,
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

  // The visible play area answers can hover in: below the header, above
  // the ship/question card. Objects spawn and float entirely within this
  // band — no off-screen spawning, no falling through it.
  const topSafeZone = insets.top + HEADER_HEIGHT + QUESTION_CARD_MARGIN;
  const bottomSafeZone = shipY - QUESTION_CARD_MARGIN;

  // Number of lanes = number of answers for the current question. Kept in
  // a ref so fireBullet's respawn logic always has the correct lane count
  // even if the question object reference changes between renders.
  const laneCountRef = useRef<number>(question.answers.length);
  useEffect(() => {
    laneCountRef.current = question.answers.length;
  }, [question]);

  // Tracks each object's current (x, y) including its live float offset,
  // used for accurate tap hit-testing.
  const objectPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const updateObjectPos = useCallback((id: number, x: number, y: number) => {
    objectPosRef.current.set(id, { x, y });
  }, []);

  const [objects, setObjects] = useState<SpaceObject[]>(() =>
    buildAnswerObjects(question, topSafeZone, bottomSafeZone, updateObjectPos),
  );
  const objectsRef = useRef<SpaceObject[]>(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  const questionIdRef = useRef<string>(question.id);
  useEffect(() => {
    if (questionIdRef.current === question.id) return;
    questionIdRef.current = question.id;
    objectsRef.current.forEach((o) => o.stop());
    objectPosRef.current.clear();
    setObjects(
      buildAnswerObjects(
        question,
        topSafeZone,
        bottomSafeZone,
        updateObjectPos,
      ),
    );
    setHitStates({});
  }, [question, topSafeZone, bottomSafeZone, updateObjectPos]);

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

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [onBack, router]);

  const handleOpenFolderPicker = useCallback(() => {
    // TODO: point this at your actual study-set picker screen/route
    router.replace("/games/SelectionWizard");
  }, [router]);

  const lastFireTimeRef = useRef<number>(0);
  const activeBulletCountRef = useRef<number>(0);

  const fireBullet = useCallback(
    (targetX: number, targetY: number, hitObject?: SpaceObject) => {
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

          setTimeout(() => {
            hitObject.stop();
            objectPosRef.current.delete(hitObject.id);

            setObjects((prev: SpaceObject[]) => {
              const remaining = prev.filter((o) => o.id !== hitObject.id);

              // Correct answer shot → round is over, clear the field.
              // (Parent should pass a new `question` prop to start the
              // next round, which spawns a brand new set to float in.)
              if (hitObject.isCorrect) {
                remaining.forEach((o) => o.stop());
                return [];
              }

              // Wrong answer shot → respawn a NEW wrong answer in the
              // SAME lane the destroyed one owned. Reusing the lane index
              // (not a random x) is what guarantees the replacement can
              // never overlap any of the other still-floating objects,
              // which each own a different lane. It gets a fresh resting
              // spot via spawnAnswerInLane — the one and only spawn path
              // in this file.
              const wrongPool = question.answers.filter((a) => !a.correct);
              const replacementText =
                wrongPool[Math.floor(Math.random() * wrongPool.length)]?.text ??
                hitObject.label;

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
      question,
      onAnswer,
    ],
  );

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;

      // Taps are ignored above the header / below the ship — objects only
      // ever float within this zone anyway.
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
    [objects, fireBullet, topSafeZone, bottomSafeZone],
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
              <Text style={styles.questionKicker}>INCOMING TRANSMISSION</Text>
            </View>
            <Text style={styles.questionText} numberOfLines={2}>
              {question.text}
            </Text>
          </View>
        </View>
      </View>

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
    elevation: 8, // Android glow approximation
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

  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default SpaceBackground;
