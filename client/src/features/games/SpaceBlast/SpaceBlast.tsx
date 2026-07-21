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
  PanResponder,
  Pressable,
  GestureResponderEvent,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ----------------------------- Types ----------------------------- */

export interface StudySet {
  id: string;
  name: string;
  /** Optional subtitle, e.g. "42 cards" or folder path */
  subtitle?: string;
}

interface SpaceBackgroundProps {
  starCount?: number;
  shootingStars?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  objectCount?: number;
  shipSize?: number;

  /** Called when the back button is pressed. If omitted, a default alert is used. */
  onBack?: () => void;

  /** List of available folders/study sets for the switcher. Defaults to dummy data. */
  studySets?: StudySet[];
  /** Currently active study set id. Defaults to the first dummy set. */
  currentStudySetId?: string;
  /** Called with the selected study set when the user picks one. */
  onSelectStudySet?: (set: StudySet) => void;

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

// ---- Dummy fallback data so the header is visible out of the box ----
const DUMMY_STUDY_SETS: StudySet[] = [
  { id: '1', name: 'Biology 101', subtitle: '42 cards' },
  { id: '2', name: 'Spanish Vocab', subtitle: '120 cards' },
  { id: '3', name: 'World History', subtitle: '78 cards' },
  { id: '4', name: 'Chemistry Basics', subtitle: '35 cards' },
];

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

function randomObject(): SpaceObject {
  const size = 30 + Math.random() * 20;
  return {
    id: objectIdCounter++,
    x: Math.random() * (SCREEN_W - size),
    y: 120 + Math.random() * (SCREEN_H * 0.45),
    size,
  };
}

/* ----------------------------- Star ----------------------------- */

const Star: React.FC<{ config: StarConfig }> = ({ config }) => {
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
};

/* ------------------------- Shooting star ------------------------- */

const ShootingStar: React.FC<{ slotIndex: number }> = ({ slotIndex }) => {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

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
        const nextDelay = 4000 + Math.random() * 6000 + slotIndex * 1500;
        setTimeout(runAnimation, nextDelay);
      });
    };

    const initialDelay = 1000 + slotIndex * 2000;
    const timeoutId = setTimeout(runAnimation, initialDelay);

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
};

/* ------------------------- Space object (asteroid) ------------------------- */

const SpaceObjectView: React.FC<{ obj: SpaceObject; exploding: boolean }> = ({
  obj,
  exploding,
}) => {
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
};

/* ------------------------------- Bullet ------------------------------- */

const BulletView: React.FC<{ bullet: Bullet }> = ({ bullet }) => (
  <Animated.View
    pointerEvents="none"
    style={[styles.bullet, { transform: bullet.anim.getTranslateTransform() }]}
  />
);

/* ---------------------------- Main component ---------------------------- */

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
  starCount = 100,
  shootingStars = true,
  backgroundColor = '#05061a',
  style,
  objectCount = 5,
  shipSize = SHIP_DEFAULT_SIZE,
  onBack,
  studySets = DUMMY_STUDY_SETS,
  currentStudySetId,
  onSelectStudySet,
  children,
}) => {
  const stars = useMemo(() => generateStars(starCount), [starCount]);

  const [objects, setObjects] = useState<SpaceObject[]>(() =>
    Array.from({ length: objectCount }, () => randomObject())
  );
  const [destroyedIds, setDestroyedIds] = useState<Set<number>>(new Set());
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Internal fallback state so the switcher works even with zero props
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

  // ---- Ship position & drag handling ----
  const initialShipPos = {
    x: SCREEN_W / 2 - shipSize / 2,
    y: SCREEN_H - shipSize - 60,
  };
  const shipPan = useRef(new Animated.ValueXY(initialShipPos)).current;
  const shipPos = useRef(initialShipPos);

  useEffect(() => {
    const id = shipPan.addListener((val) => {
      shipPos.current = val;
    });
    return () => shipPan.removeListener(id);
  }, [shipPan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        shipPan.setOffset(shipPos.current);
        shipPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: shipPan.x, dy: shipPan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        shipPan.flattenOffset();
      },
    })
  ).current;

  // ---- Firing ----
  const fireBullet = useCallback(
    (targetX: number, targetY: number, hitObjectId?: number) => {
      const startX = shipPos.current.x + shipSize / 2 - 3;
      const startY = shipPos.current.y;

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
        useNativeDriver: false,
      }).start(() => {
        setBullets((prev) => prev.filter((b) => b.id !== id));

        if (hitObjectId !== undefined) {
          setDestroyedIds((prev) => new Set(prev).add(hitObjectId));
          setTimeout(() => {
            setObjects((prev) => [
              ...prev.filter((o) => o.id !== hitObjectId),
              randomObject(),
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
    [shipSize]
  );

  const handleTap = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;

      // Ignore taps on the header area so header buttons stay usable
      if (locationY < 100) return;

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
    [objects, fireBullet]
  );

  const handleSelectStudySet = (set: StudySet) => {
    setPickerVisible(false);
    setInternalSetId(set.id);
    onSelectStudySet?.(set);
  };

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={[styles.nebula, styles.nebulaOne]} />
      <View style={[styles.nebula, styles.nebulaTwo]} />

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

      {/* Tap layer: tapping an object shoots + destroys it, tapping empty space just fires */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.ship,
          {
            width: shipSize,
            height: shipSize,
            transform: shipPan.getTranslateTransform(),
          },
        ]}
      >
        <View style={styles.shipBody} />
      </Animated.View>

      {/* ---------------- Header: back button + study set switcher ---------------- */}
      <SafeAreaView style={styles.headerSafeArea} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
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
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [
              styles.studySetButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.studySetLabel} numberOfLines={1}>
              {currentStudySet ? currentStudySet.name : 'Select study set'}
            </Text>
            <View style={styles.chevronDown} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ---------------- Study set / folder picker modal ---------------- */}
      <Modal
        visible={pickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Choose a study set</Text>
            <FlatList
              data={studySets}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isActive = item.id === activeSetId;
                return (
                  <Pressable
                    onPress={() => handleSelectStudySet(item)}
                    style={({ pressed }) => [
                      styles.studySetRow,
                      isActive && styles.studySetRowActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.folderIcon} />
                    <View style={styles.studySetTextWrap}>
                      <Text style={styles.studySetRowTitle}>{item.name}</Text>
                      {item.subtitle ? (
                        <Text style={styles.studySetRowSubtitle}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {isActive && <View style={styles.activeDot} />}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </Pressable>
      </Modal>

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
  nebula: {
    position: 'absolute',
    borderRadius: 999,
  },
  nebulaOne: {
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    top: -SCREEN_W * 0.3,
    left: -SCREEN_W * 0.2,
    backgroundColor: '#2a1a4d',
    opacity: 0.35,
  },
  nebulaTwo: {
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    bottom: -SCREEN_W * 0.25,
    right: -SCREEN_W * 0.25,
    backgroundColor: '#0d2b4d',
    opacity: 0.3,
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
  ship: {
    position: 'absolute',
    left: 0,
    top: 0,
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

  /* ---- Header ---- */
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 12,
    height: 12,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  studySetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    maxWidth: SCREEN_W * 0.65,
  },
  studySetLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    flexShrink: 1,
  },
  chevronDown: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  pressed: {
    opacity: 0.6,
  },

  /* ---- Modal picker ---- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#12132b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: SCREEN_H * 0.6,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalList: {
    flexGrow: 0,
  },
  studySetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  studySetRowActive: {
    backgroundColor: 'rgba(79,209,255,0.12)',
  },
  folderIcon: {
    width: 22,
    height: 16,
    backgroundColor: '#4fd1ff',
    borderRadius: 3,
    marginRight: 12,
  },
  studySetTextWrap: {
    flex: 1,
  },
  studySetRowTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  studySetRowSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4fd1ff',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default SpaceBackground;