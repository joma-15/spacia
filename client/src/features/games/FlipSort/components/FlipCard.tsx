/**
 * FlipCard.tsx
 * ─────────────────────────────────────────────
 * The main 3D-flipping flashcard. Swipe left to mark as Review,
 * swipe right to mark as Understood, swipe up to Skip.
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

const CARD_HEIGHT = 440;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD_X = SCREEN_WIDTH * 0.25;
const SWIPE_THRESHOLD_Y = CARD_HEIGHT * 0.25;
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
  /** Called when the card is swiped past the threshold. "left" = review, "right" = understood, "up" = skip */
  onSwipe: (direction: "left" | "right" | "up") => void;
  /** True if this is the first card in the deck (disables swiping down) */
  isFirstCard: boolean;
}

const FlipCard: React.FC<Props> = ({
  card,
  showBack,
  frontInterpolate,
  backInterpolate,
  onFlip,
  onSwipe,
  isFirstCard,
}) => {
  // Drives the swipe gesture — 2D drag
  const position = useRef(new Animated.ValueXY()).current;

  // Prevents a new swipe gesture from starting while the previous
  // card is still animating off-screen (avoids double-advance races).
  const isAnimatingOutRef = useRef(false);

  // Snap the card back to center whenever a new card comes in
  useEffect(() => {
    if (!card) return;
    position.setValue({ x: 0, y: 0 });
    isAnimatingOutRef.current = false;
  }, [card?.id, position]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim the gesture if it's a significant drag in X or Y
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        if (isAnimatingOutRef.current) return false;
        const isHorizontal = Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2;
        const isVerticalUp = gesture.dy < -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;
        const isVerticalDown = gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;
        return isHorizontal || isVerticalUp || isVerticalDown;
      },

      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        {
          useNativeDriver: false,
        },
      ),

      onPanResponderRelease: (_evt, gesture) => {
        const pastThresholdX = Math.abs(gesture.dx) > SWIPE_THRESHOLD_X || Math.abs(gesture.vx) > 0.5;
        const pastThresholdY = gesture.dy < -SWIPE_THRESHOLD_Y || gesture.vy < -0.5; // only up is valid

        if (pastThresholdX) {
          const isLeft = gesture.dx < 0;
          isAnimatingOutRef.current = true;
          Animated.timing(position, {
            toValue: { x: isLeft ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5, y: gesture.dy },
            duration: SWIPE_OUT_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            isAnimatingOutRef.current = false; // Reset to avoid freezing
            onSwipe(isLeft ? "left" : "right");
          });
        } else if (pastThresholdY) {
          isAnimatingOutRef.current = true;
          Animated.timing(position, {
            toValue: { x: gesture.dx, y: -SCREEN_HEIGHT * 1.5 },
            duration: SWIPE_OUT_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            isAnimatingOutRef.current = false;
            onSwipe("up");
          });
        } else {
          // Smoothly animate back to center with ease-out timing (no bounce)
          Animated.timing(position, {
            toValue: { x: 0, y: 0 },
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  // Fades a "REVIEW" badge in while dragging left (dx < 0)
  const reviewBadgeOpacity = position.x.interpolate({
    inputRange: [-140, -40, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  // Fades an "UNDERSTOOD" badge in while dragging right (dx > 0)
  const understoodBadgeOpacity = position.x.interpolate({
    inputRange: [0, 40, 140],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  // Fades a "SKIP" badge in while dragging up (dy < 0)
  const skipBadgeOpacity = position.y.interpolate({
    inputRange: [-140, -40, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  // Slight rotation based on horizontal drag distance
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  // Fades the orange review border glow in quickly when dragging left
  const reviewGlowOpacity = position.x.interpolate({
    inputRange: [-120, -10, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  // Fades the green understood border glow in quickly when dragging right
  const understoodGlowOpacity = position.x.interpolate({
    inputRange: [0, 10, 120],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
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
            { rotate: rotation },
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
          {/* Quizlet-style Glow Borders */}
          <Animated.View
            style={[
              styles.glowBorder,
              styles.reviewGlow,
              { opacity: reviewGlowOpacity },
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.glowBorder,
              styles.understoodGlow,
              { opacity: understoodGlowOpacity },
            ]}
            pointerEvents="none"
          />

          {card.status ? (
            <View
              style={[
                styles.statusPill,
                card.status === "understood" ? styles.understoodPill : styles.reviewPill,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  card.status === "understood" ? styles.understoodPillText : styles.reviewPillText,
                ]}
              >
                {card.status === "understood" ? "✓ Understood" : "🔁 Review"}
              </Text>
            </View>
          ) : null}
          <Text style={styles.label}>QUESTION</Text>
          <Text style={styles.cardText}>{card.question}</Text>
          <Text style={styles.tapHint}>
            Tap to flip · Swipe left to Review · Swipe right to Understood
          </Text>
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
          {/* Quizlet-style Glow Borders */}
          <Animated.View
            style={[
              styles.glowBorder,
              styles.reviewGlow,
              { opacity: reviewGlowOpacity },
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.glowBorder,
              styles.understoodGlow,
              { opacity: understoodGlowOpacity },
            ]}
            pointerEvents="none"
          />

          {card.status ? (
            <View
              style={[
                styles.statusPill,
                card.status === "understood" ? styles.understoodPill : styles.reviewPill,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  card.status === "understood" ? styles.understoodPillText : styles.reviewPillText,
                ]}
              >
                {card.status === "understood" ? "✓ Understood" : "🔁 Review"}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.label, styles.labelBack]}>ANSWER</Text>
          <Text style={styles.cardText}>{card.answer}</Text>
          <Text style={styles.tapHint}>
            Tap to flip · Swipe left to Review · Swipe right to Understood
          </Text>
        </Animated.View>
      </Pressable>

      {/* Swipe affordance — sits above both faces, ignores touches */}
      <View style={styles.swipeHintRow} pointerEvents="none">
        <Text style={styles.swipeHintText}>Swipe Left to Review • Right for Understood</Text>
      </View>

      {/* "REVIEW" badge — fades in while dragging left */}
      <Animated.View
        style={[
          styles.badge,
          styles.reviewBadge,
          { opacity: reviewBadgeOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.reviewBadgeText}>REVIEW</Text>
      </Animated.View>

      {/* "UNDERSTOOD" badge — fades in while dragging right */}
      <Animated.View
        style={[
          styles.badge,
          styles.understoodBadge,
          { opacity: understoodBadgeOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.understoodBadgeText}>UNDERSTOOD</Text>
      </Animated.View>

      {/* "SKIP" badge — fades in while dragging up */}
      <Animated.View
        style={[
          styles.badge,
          styles.skipBadge,
          { opacity: skipBadgeOpacity },
        ]}
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
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
  },
  tapHint: {
    position: "absolute",
    bottom: 18,
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  swipeHintRow: {
    position: "absolute",
    top: -28,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHintText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  badge: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  reviewBadge: {
    backgroundColor: "rgba(58, 42, 20, 0.95)",
    borderColor: COLORS.reviewBorder,
  },
  reviewBadgeText: {
    color: COLORS.reviewText,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  understoodBadge: {
    backgroundColor: "rgba(31, 122, 75, 0.95)",
    borderColor: COLORS.understoodBorder,
  },
  understoodBadgeText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  skipBadge: {
    backgroundColor: "rgba(22, 41, 31, 0.95)",
    borderColor: COLORS.textDim,
  },
  skipBadgeText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  statusPill: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  understoodPill: {
    backgroundColor: COLORS.understoodBg,
    borderColor: COLORS.understoodBorder,
  },
  reviewPill: {
    backgroundColor: COLORS.reviewBg,
    borderColor: COLORS.reviewBorder,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  understoodPillText: {
    color: COLORS.understoodText,
  },
  reviewPillText: {
    color: COLORS.reviewText,
  },
  glowBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 4,
  },
  reviewGlow: {
    borderColor: COLORS.reviewText,
    backgroundColor: "rgba(240, 169, 59, 0.04)",
  },
  understoodGlow: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(52, 209, 123, 0.04)",
  },
});