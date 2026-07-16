/**
 * FlipCard.tsx
 * ─────────────────────────────────────────────
 * The main 3D-flipping flashcard. Also swipeable in any direction
 * (left or right) to skip to the next card — works whether the
 * answer is showing or not.
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../colors";
import type { Flashcard } from "../types";

const CARD_HEIGHT = 320;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 220;

interface Props {
  card: Flashcard;
  /** True once the back face is the one receiving touches */
  showBack: boolean;
  /** Animated rotation (deg) for the front face */
  frontInterpolate: Animated.AnimatedInterpolation<string>;
  /** Animated rotation (deg) for the back face */
  backInterpolate: Animated.AnimatedInterpolation<string>;
  /** Called when the card is tapped anywhere */
  onFlip: () => void;
  /** Called when the card is swiped past the threshold, in either direction */
  onSwipe: () => void;
}

const FlipCard: React.FC<Props> = ({
  card,
  showBack,
  frontInterpolate,
  backInterpolate,
  onFlip,
  onSwipe,
}) => {
  // Drives the swipe gesture — horizontal drag, vertical drift, rotation
  const position = useRef(new Animated.ValueXY()).current;

  // Prevents a new swipe gesture from starting while the previous
  // card is still animating off-screen (avoids double-advance races).
  const isAnimatingOutRef = useRef(false);

  // Snap the card back to center whenever a new card comes in
  // Snap the card back to center whenever a new card comes in
  useEffect(() => {
    if (!card) return;
    position.setValue({ x: 0, y: 0 });
    isAnimatingOutRef.current = false;
  }, [card?.id, position]);

  // Idle "shimmy" animation so the user notices the card is swipeable,
  // even before they interact with it.
  const hintShimmy = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(hintShimmy, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hintShimmy, {
          toValue: -1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hintShimmy, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hintShimmy]);

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture once it's clearly a horizontal drag,
      // so a plain tap still reaches the flip Pressable underneath.
      // Also blocked while the previous card is still animating out.
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        !isAnimatingOutRef.current &&
        Math.abs(gesture.dx) > 8 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,

      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        {
          useNativeDriver: false,
        },
      ),

      onPanResponderRelease: (_evt, gesture) => {
        const pastThreshold = Math.abs(gesture.dx) > SWIPE_THRESHOLD;

        if (pastThreshold) {
          isAnimatingOutRef.current = true; // ← add this line
          const direction = gesture.dx > 0 ? 1 : -1;
          Animated.timing(position, {
            toValue: { x: direction * SCREEN_WIDTH * 1.2, y: gesture.dy },
            duration: SWIPE_OUT_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipe();
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  // Fades a "SKIP" badge in as the card is dragged in either direction
  const skipBadgeOpacity = position.x.interpolate({
    inputRange: [-140, -40, 0, 40, 140],
    outputRange: [1, 0, 0, 0, 1],
    extrapolate: "clamp",
  });

  const hintTranslate = hintShimmy.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  if (!card) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable onPress={onFlip} style={styles.pressable}>
        {/* ── FRONT FACE: the question ── */}
        <Animated.View
          style={[
            styles.card,
            styles.face,
            { transform: [{ rotateY: frontInterpolate }] },
          ]}
          pointerEvents={showBack ? "none" : "auto"}
        >
          <Text style={styles.label}>QUESTION</Text>
          <Text style={styles.cardText}>{card.question}</Text>
          <Text style={styles.tapHint}>Tap to reveal · Swipe to skip</Text>
        </Animated.View>

        {/* ── BACK FACE: the answer ── */}
        <Animated.View
          style={[
            styles.card,
            styles.face,
            styles.backFace,
            { transform: [{ rotateY: backInterpolate }] },
          ]}
          pointerEvents={showBack ? "auto" : "none"}
        >
          <Text style={[styles.label, styles.labelBack]}>ANSWER</Text>
          <Text style={styles.cardText}>{card.answer}</Text>
          <Text style={styles.tapHint}>
            Tap to see question · Swipe to skip
          </Text>
        </Animated.View>
      </Pressable>

      {/* Swipe affordance — sits above both faces, ignores touches */}
      <View style={styles.swipeHintRow} pointerEvents="none">
        <Animated.Text
          style={[
            styles.chevron,
            { transform: [{ translateX: hintTranslate }] },
          ]}
        >
          ‹
        </Animated.Text>
        <Text style={styles.swipeHintText}>swipe</Text>
        <Animated.Text
          style={[
            styles.chevron,
            { transform: [{ translateX: hintTranslate }] },
          ]}
        >
          ›
        </Animated.Text>
      </View>

      {/* "SKIP" badge — fades in while dragging */}
      <Animated.View
        style={[styles.skipBadge, { opacity: skipBadgeOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.skipBadgeText}>SKIP</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default FlipCard;

const styles = StyleSheet.create({
  container: { width: "100%", height: CARD_HEIGHT },
  pressable: { width: "100%", height: CARD_HEIGHT },
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: COLORS.cardFrontBg,
    borderWidth: 1,
    borderColor: COLORS.cardFrontBorder,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  face: {
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  backFace: {
    backgroundColor: COLORS.cardBackBg,
    borderColor: COLORS.cardBackBorder,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  labelBack: { color: COLORS.primary },
  cardText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 30,
  },
  tapHint: {
    position: "absolute",
    bottom: 18,
    color: COLORS.textDim,
    fontSize: 12,
  },
  swipeHintRow: {
    position: "absolute",
    top: -28,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    color: COLORS.textDim,
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 6,
  },
  swipeHintText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  skipBadge: {
    position: "absolute",
    top: "42%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  skipBadgeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
