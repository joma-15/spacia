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

/* ----------------------------- Types ----------------------------- */

export interface StudySet {
  id: string;
  name: string;
  subtitle?: string;
}

export interface Question {
  id: string;
  text: string;
}

interface SpaceBackgroundProps {
  starCount?: number;
  shootingStars?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  objectCount?: number;
  shipSize?: number;

  onBack?: () => void;

  studySets?: StudySet[];
  currentStudySetId?: string;
  onSelectStudySet?: (set: StudySet) => void;

  /** Static question shown in the card near the bottom. */
  question?: Question;

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
// Extra vertical gap kept between the ship and the question card below it,
// and used to clamp asteroid spawn positions so they never dip into the ship.
const SHIP_QUESTION_GAP = 20;
const MAX_ASTEROID_SIZE = 50; // 30 + 20 (upper bound from randomObject's size formula)

const DUMMY_STUDY_SETS: StudySet[] = [
  { id: '1', name: 'Biology 101', subtitle: '42 cards' },
  { id: '2', name: 'Spanish Vocab', subtitle: '120 cards' },
  { id: '3', name: 'World History', subtitle: '78 cards' },
  { id: '4', name: 'Chemistry Basics', subtitle: '35 cards' },
];

const DUMMY_QUESTION: Question = {
  id: 'q1',
  text: 'What is the powerhouse of the cell?',
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

// minY/maxY define the vertical band the asteroid's TOP edge may spawn in.
// We subtract MAX_ASTEROID_SIZE from maxY before calling this so that even
// the largest possible asteroid's bottom edge stays within maxY.
function randomObject(minY: number, maxY: number): SpaceObject {
  const size = 30 + Math.random() * 20;
  const safeMaxY = Math.max(minY, maxY - MAX_ASTEROID_SIZE);
  return {
    id: objectIdCounter++,
    x: Math.random() * (SCREEN_W - size),
    y: minY + Math.random() * Math.max(1, safeMaxY - minY),
    size,
  };
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

/* ------------------------- Space object (asteroid) ------------------------- */

const SpaceObjectView: React.FC<{ obj: SpaceObject; exploding: boolean }> =
  React.memo(({ obj, exploding }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (exploding) {
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
    }, [exploding, scale, opacity]);

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
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
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
  backgroundColor = '#000000',
  style,
  objectCount = 5,
  shipSize = SHIP_DEFAULT_SIZE,
  onBack,
  studySets = DUMMY_STUDY_SETS,
  currentStudySetId,
  onSelectStudySet,
  question = DUMMY_QUESTION,
  maxBullets = 5,
  fireCooldownMs = 220,
  children,
}) => {
  const insets = useSafeAreaInsets();

  const stars = useMemo(() => generateStars(starCount), [starCount]);

  // Question card now anchors to the very bottom edge...
  const questionCardBottom = insets.bottom + 16;
  const questionCardTop = SCREEN_H - questionCardBottom - QUESTION_CARD_HEIGHT;

  // ...and the ship sits ABOVE it, with a guaranteed gap (SHIP_QUESTION_GAP)
  // so the ship and the question card never visually touch or overlap.
  const shipBottomOffset =
    questionCardBottom + QUESTION_CARD_HEIGHT + SHIP_QUESTION_GAP;
  const shipX = SCREEN_W / 2 - shipSize / 2;
  const shipY = SCREEN_H - shipSize - shipBottomOffset;

  // Play area for asteroids: below the header, above the ship,
  // with an extra margin so asteroid circles can't visually clip either.
  const topSafeZone = insets.top + HEADER_HEIGHT + QUESTION_CARD_MARGIN;
  const bottomSafeZone = shipY - QUESTION_CARD_MARGIN;

  const [objects, setObjects] = useState<SpaceObject[]>(() =>
    Array.from({ length: objectCount }, () =>
      randomObject(topSafeZone, bottomSafeZone)
    )
  );
  const [destroyedIds, setDestroyedIds] = useState<Set<number>>(new Set());
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

  // ---- Folder / study set switcher: Alert-based for now ----
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

  // ---- Bullet rate limiting ----
  const lastFireTimeRef = useRef(0);
  const activeBulletCountRef = useRef(0);

  const fireBullet = useCallback(
    (targetX: number, targetY: number, hitObjectId?: number) => {
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

        if (hitObjectId !== undefined) {
          setDestroyedIds((prev) => new Set(prev).add(hitObjectId));
          setTimeout(() => {
            setObjects((prev) => [
              ...prev.filter((o) => o.id !== hitObjectId),
              randomObject(topSafeZone, bottomSafeZone),
            ]);
            setDestroyedIds((prev) => {
              const next = new Set(prev);
              next.delete(hitObjectId);
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
    ]
  );

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;

      // Ignore taps over the header or the ship/question zone
      if (locationY < topSafeZone || locationY > bottomSafeZone) return;

      const hitObject = objects.find((obj) => {
        const cx = obj.x + obj.size / 2;
        const cy = obj.y + obj.size / 2;
        const dist = Math.sqrt((locationX - cx) ** 2 + (locationY - cy) ** 2);
        return dist <= obj.size / 2 + 10;
      });

      if (hitObject) {
        const cx = hitObject.x + hitObject.size / 2;
        const cy = hitObject.y + hitObject.size / 2;
        fireBullet(cx, cy, hitObject.id);
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
          exploding={destroyedIds.has(obj.id)}
        />
      ))}

      {bullets.map((bullet) => (
        <BulletView key={bullet.id} bullet={bullet} />
      ))}

      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* ---------------- Fixed ship ---------------- */}
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

      {/* ---------------- Question HUD panel (below the ship, near bottom) ---------------- */}
      <View
        style={[
          styles.questionCard,
          { bottom: questionCardBottom, height: QUESTION_CARD_HEIGHT },
        ]}
        pointerEvents="box-none"
      >
        {/* sci-fi corner brackets */}
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
    backgroundColor: '#8b8b9e',
    borderWidth: 2,
    borderColor: '#5c5c73',
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

  /* ---- Ship (fixed) ---- */
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

  /* ---- Header ---- */
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

  /* ---- Folder / study set button (green theme, no dropdown chevron) ---- */
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    maxWidth: SCREEN_W * 0.62,
  },
  folderIconSmall: {
    width: 16,
    height: 12,
    backgroundColor: '#2ecc71',
    borderRadius: 2,
    marginRight: 8,
  },
  folderLabel: {
    color: '#eafff2',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },

  /* ---- Question HUD panel (below the ship, near bottom) ---- */
  questionCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 15,
    backgroundColor: 'rgba(10,14,26,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.3)',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'center',
    shadowColor: '#4fd1ff',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  cornerBracket: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: '#4fd1ff',
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
    backgroundColor: 'rgba(79,209,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionBadgeDiamond: {
    width: 10,
    height: 10,
    backgroundColor: '#4fd1ff',
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
    backgroundColor: '#4fd1ff',
    marginRight: 6,
  },
  questionKicker: {
    color: '#4fd1ff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionText: {
    color: '#ffffff',
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
