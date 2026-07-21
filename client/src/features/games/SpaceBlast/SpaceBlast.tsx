import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ═══════════════════════════════════════════════════════════════════════
 * THEME — all colors/radii/shadows in one place, edit here to re-skin.
 * ═══════════════════════════════════════════════════════════════════════ */
const THEME = {
  bg: '#0F1F17',
  bgCard: '#162B1E',
  bgElevated: '#1C3527',

  primary: '#3DDC84',
  primaryDim: '#2AAF63',
  primaryGlow: 'rgba(61,220,132,0.25)',

  correct: '#3DDC84',
  correctGlow: 'rgba(61,220,132,0.35)',
  wrong: '#E05C7A',
  wrongGlow: 'rgba(224,92,122,0.35)',

  textWhite: '#F0FFF6',
  textMid: '#A8C5B0',
  textMuted: '#5A7A65',

  border: '#243D2C',
  borderBright: '#2E5438',

  panelBg: 'rgba(15,31,23,0.78)',
  panelBorder: 'rgba(61,220,132,0.35)',

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
  x: number;
  size: number;
  minY: number;
  maxY: number;
  anim: Animated.Value;
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

const NUM_SHOOTING_STAR_SLOTS = 2;
const SHIP_DEFAULT_SIZE = 44;
const BULLET_SPEED = 700;
const HEADER_HEIGHT = 56;
const QUESTION_CARD_HEIGHT = 92;
const QUESTION_CARD_MARGIN = 12;

const SHIP_QUESTION_GAP = 8;

// Answer objects are circles this size (diameter, in px).
const ANSWER_OBJECT_SIZE = 78;

// Fall speed range in ms — edit these two numbers to change speed.
const FALL_MIN_DURATION = 5000;
const FALL_MAX_DURATION = 9000;

// How far above the very top of the screen an answer spawns, so it falls
// in from fully off-screen instead of popping in inside the play area.
// Bigger number = spawns higher up / takes longer to become visible.
const SPAWN_ABOVE_SCREEN = 60;

const DUMMY_STUDY_SETS: StudySet[] = [
  { id: '1', name: 'Biology 101', subtitle: '42 cards' },
  { id: '2', name: 'Spanish Vocab', subtitle: '120 cards' },
  { id: '3', name: 'World History', subtitle: '78 cards' },
  { id: '4', name: 'Chemistry Basics', subtitle: '35 cards' },
];

const DUMMY_QUESTION: Question = {
  id: 'q1',
  text: 'What is the powerhouse of the cell?',
  answers: [
    { id: 'a1', text: 'Mitochondria', correct: true },
    { id: 'a2', text: 'Nucleus', correct: false },
    { id: 'a3', text: 'Ribosome', correct: false },
    { id: 'a4', text: 'Golgi Apparatus', correct: false },
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
 * a guarantee rather than a probability.
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
 * THE single source of truth for spawning a falling answer.
 *
 * Every answer object — whether it's part of the initial batch for a new
 * question, or a replacement spawned after a wrong answer gets shot —
 * goes through this exact function. Because there's only one code path,
 * it's structurally impossible for an object to spawn anywhere except
 * "off-screen above, in its assigned lane."
 *
 * `spawnY` is always negative (above y = 0), computed once in the main
 * component from SPAWN_ABOVE_SCREEN — nothing here ever picks a random
 * starting height.
 */
function spawnAnswerInLane(
  label: string,
  isCorrect: boolean,
  laneIndex: number,
  laneCount: number,
  spawnY: number,
  maxY: number,
  onUpdate: (id: number, y: number) => void
): SpaceObject {
  const size = ANSWER_OBJECT_SIZE;
  const x = laneX(laneIndex, laneCount);
  const safeMaxY = Math.max(spawnY, maxY - size);
  const travelDistance = safeMaxY - spawnY;
  const id = objectIdCounter++;
  const duration =
    FALL_MIN_DURATION + Math.random() * (FALL_MAX_DURATION - FALL_MIN_DURATION);

  const anim = new Animated.Value(0);

  // Random head start along the fall so simultaneously-spawned answers
  // don't all move in visible lock-step, while still always starting
  // from spawnY (off-screen above) — the head start only affects how far
  // ALONG that same top-to-bottom path it starts.
  const startProgress = Math.random();
  anim.setValue(startProgress);
  onUpdate(id, spawnY + startProgress * travelDistance);

  const listenerId = anim.addListener(({ value }) => {
    onUpdate(id, spawnY + value * travelDistance);
  });

  const runLoop = () => {
    Animated.timing(anim, {
      toValue: 1,
      duration: duration * (1 - startProgress),
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      anim.setValue(0);
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  };
  runLoop();

  const stop = () => {
    anim.stopAnimation();
    anim.removeListener(listenerId);
  };

  return {
    id,
    x,
    size,
    minY: spawnY,
    maxY: safeMaxY,
    anim,
    stop,
    label,
    isCorrect,
    laneIndex,
  };
}

/**
 * Builds the full set of falling answer objects for a question: one
 * object per answer, each permanently assigned to its own lane
 * (0..answers.length-1), all spawning off-screen above the header.
 */
function buildAnswerObjects(
  question: Question,
  spawnY: number,
  maxY: number,
  onUpdate: (id: number, y: number) => void
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
      spawnY,
      maxY,
      onUpdate
    )
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
      ])
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
            transform: [{ translateX }, { translateY }, { rotate: '35deg' }],
          },
        ]}
      />
    );
  }
);

/* ------------------------- Answer object (falling circle) ------------------------- */

const SpaceObjectView: React.FC<{
  obj: SpaceObject;
  hitState: 'none' | 'correct' | 'wrong';
}> = React.memo(({ obj, hitState }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hitState !== 'none') {
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

  // Fall driven by translateY on the native thread — smooth, no JS lag.
  const translateY = obj.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, obj.maxY - obj.minY],
  });

  const flashBorderColor =
    hitState === 'correct' ? THEME.correct : hitState === 'wrong' ? THEME.wrong : THEME.borderBright;
  const flashBg =
    hitState === 'correct' ? THEME.correctGlow : hitState === 'wrong' ? THEME.wrongGlow : THEME.bgElevated;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spaceObject,
        {
          left: obj.x,
          top: obj.minY,
          width: obj.size,
          height: obj.size,
          // obj.size / 2 makes this a perfect circle regardless of size.
          borderRadius: obj.size / 2,
          backgroundColor: flashBg,
          borderColor: flashBorderColor,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.spaceObjectLabel} numberOfLines={3}>
        {obj.label}
      </Text>
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
  studySets = DUMMY_STUDY_SETS,
  currentStudySetId,
  onSelectStudySet,
  question = DUMMY_QUESTION,
  onAnswer,
  maxBullets = 5,
  fireCooldownMs = 220,
  children,
}) => {
  const insets = useSafeAreaInsets();

  const stars = useMemo(() => generateStars(starCount), [starCount]);

  const questionCardBottom = insets.bottom + 16;
  const shipBottomOffset =
    questionCardBottom + QUESTION_CARD_HEIGHT + SHIP_QUESTION_GAP;
  const shipX = SCREEN_W / 2 - shipSize / 2;
  const shipY = SCREEN_H - shipSize - shipBottomOffset;

  // topSafeZone is only used to gate taps over the header now — objects
  // never spawn there, only pass through it while falling.
  const topSafeZone = insets.top + HEADER_HEIGHT + QUESTION_CARD_MARGIN;
  const bottomSafeZone = shipY - QUESTION_CARD_MARGIN;

  // The ONE spawn height used everywhere — fully off-screen above y = 0.
  const spawnY = -ANSWER_OBJECT_SIZE - SPAWN_ABOVE_SCREEN;

  // Number of lanes = number of answers for the current question. Kept in
  // a ref so fireBullet's respawn logic always has the correct lane count
  // even if the question object reference changes between renders.
  const laneCountRef = useRef(question.answers.length);
  useEffect(() => {
    laneCountRef.current = question.answers.length;
  }, [question]);

  const objectYRef = useRef<Map<number, number>>(new Map());
  const updateObjectY = useCallback((id: number, y: number) => {
    objectYRef.current.set(id, y);
  }, []);

  const [objects, setObjects] = useState<SpaceObject[]>(() =>
    buildAnswerObjects(question, spawnY, bottomSafeZone, updateObjectY)
  );
  const objectsRef = useRef(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  const questionIdRef = useRef(question.id);
  useEffect(() => {
    if (questionIdRef.current === question.id) return;
    questionIdRef.current = question.id;
    objectsRef.current.forEach((o) => o.stop());
    objectYRef.current.clear();
    setObjects(
      buildAnswerObjects(question, spawnY, bottomSafeZone, updateObjectY)
    );
    setHitStates({});
  }, [question, spawnY, bottomSafeZone, updateObjectY]);

  useEffect(() => {
    return () => {
      objectsRef.current.forEach((o) => o.stop());
    };
  }, []);

  const [hitStates, setHitStates] = useState<Record<number, 'correct' | 'wrong'>>({});
  const [bullets, setBullets] = useState<Bullet[]>([]);

  const [internalSetId, setInternalSetId] = useState(
    currentStudySetId ?? studySets[0]?.id
  );
  const activeSetId = currentStudySetId ?? internalSetId;
  const currentStudySet = studySets.find((s) => s.id === activeSetId);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      Alert.alert('Back pressed', 'Wire up the onBack prop to navigate.');
    }
  }, [onBack]);

  const handleOpenFolderPicker = useCallback(() => {
    const setButtons = studySets.map((set) => ({
      text: set.subtitle ? `${set.name} (${set.subtitle})` : set.name,
      onPress: () => {
        setInternalSetId(set.id);
        onSelectStudySet?.(set);
      },
    }));

    Alert.alert(
      'Choose a study set',
      'Navigate to the folder picker screen here later.',
      [...setButtons, { text: 'Cancel', style: 'cancel' }],
      { cancelable: true }
    );
  }, [studySets, onSelectStudySet]);

  const lastFireTimeRef = useRef(0);
  const activeBulletCountRef = useRef(0);

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

      setBullets((prev) => [...prev, bullet]);

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
          activeBulletCountRef.current - 1
        );
        setBullets((prev) => prev.filter((b) => b.id !== id));

        if (hitObject) {
          const result: 'correct' | 'wrong' = hitObject.isCorrect ? 'correct' : 'wrong';
          setHitStates((prev) => ({ ...prev, [hitObject.id]: result }));

          onAnswer?.(hitObject.isCorrect, hitObject.label);

          setTimeout(() => {
            hitObject.stop();
            objectYRef.current.delete(hitObject.id);

            setObjects((prev) => {
              const remaining = prev.filter((o) => o.id !== hitObject.id);

              // Correct answer shot → round is over, clear the field.
              // (Parent should pass a new `question` prop to start the
              // next round, which spawns a brand new set from above.)
              if (hitObject.isCorrect) {
                remaining.forEach((o) => o.stop());
                return [];
              }

              // Wrong answer shot → respawn a NEW wrong answer in the
              // SAME lane the destroyed one owned. Reusing the lane index
              // (not a random x) is what guarantees the replacement can
              // never overlap any of the other still-falling objects,
              // which each own a different lane. It always spawns from
              // spawnY (off-screen above) via spawnAnswerInLane — the one
              // and only spawn path in this file.
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
                  spawnY,
                  bottomSafeZone,
                  updateObjectY
                ),
              ];
            });

            setHitStates((prev) => {
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
      spawnY,
      bottomSafeZone,
      updateObjectY,
      question,
      onAnswer,
    ]
  );

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;

      // Taps are ignored above the header / below the ship — answers
      // fall through this zone but are only "shootable" while inside it.
      if (locationY < topSafeZone || locationY > bottomSafeZone) return;

      const hitObject = objects.find((obj) => {
        const currentY = objectYRef.current.get(obj.id) ?? obj.minY;
        const cx = obj.x + obj.size / 2;
        const cy = currentY + obj.size / 2;
        const dist = Math.sqrt((locationX - cx) ** 2 + (locationY - cy) ** 2);
        return dist <= obj.size / 2 + 10;
      });

      if (hitObject) {
        const currentY = objectYRef.current.get(hitObject.id) ?? hitObject.minY;
        const cx = hitObject.x + hitObject.size / 2;
        const cy = currentY + hitObject.size / 2;
        fireBullet(cx, cy, hitObject);
      } else {
        fireBullet(locationX, locationY);
      }
    },
    [objects, fireBullet, topSafeZone, bottomSafeZone]
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
          hitState={hitStates[obj.id] ?? 'none'}
        />
      ))}

      {bullets.map((bullet) => (
        <BulletView key={bullet.id} bullet={bullet} />
      ))}

      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* ---------------- Fixed ship (triangle) ---------------- */}
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
        <View style={styles.shipBody} />
        <View style={styles.shipThruster} />
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
            {currentStudySet ? currentStudySet.name : 'Select study set'}
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
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  shootingStar: {
    position: 'absolute',
    width: 90,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  spaceObject: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  spaceObjectLabel: {
    color: THEME.textWhite,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  bullet: {
    position: 'absolute',
    left: -3,
    top: 0,
    width: 6,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#ffe066',
    shadowColor: '#ffe066',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  ship: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipBody: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 34,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4fd1ff',
  },
  shipThruster: {
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffb84d',
    marginTop: -2,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: HEADER_HEIGHT + 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 11,
    height: 11,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    borderColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },

  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },

  questionCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 15,
    backgroundColor: THEME.panelBg,
    borderWidth: 1,
    borderColor: THEME.panelBorder,
    borderRadius: THEME.radiusMd,
    padding: 14,
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  cornerBracket: {
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionBadgeDiamond: {
    width: 10,
    height: 10,
    backgroundColor: THEME.primary,
    transform: [{ rotate: '45deg' }],
  },
  questionTextBlock: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionText: {
    color: THEME.textWhite,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },

  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default SpaceBackground;