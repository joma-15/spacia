/**
 * FlipCard.tsx
 * ─────────────────────────────────────────────
 * The main 3D-flipping flashcard. Swipe up to move to the next card,
 * swipe down to return to the previous card.
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
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = CARD_HEIGHT * 0.25;
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
  /** Called when the card is swiped past the threshold. "up" = forward, "down" = back */
  onSwipe: (direction: "up" | "down") => void;
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
  // Drives the swipe gesture — vertical drag
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
      // Only claim the gesture once it's clearly a vertical drag,
      // so a plain tap still reaches the flip Pressable underneath.
      // Also blocked while the previous card is still animating out.
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        !isAnimatingOutRef.current &&
        Math.abs(gesture.dy) > 8 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5,

      onPanResponderMove: Animated.event(
        [null, { dy: position.y }],
        {
          useNativeDriver: false,
        },
      ),

      onPanResponderRelease: (_evt, gesture) => {
        const pastThreshold = Math.abs(gesture.dy) > SWIPE_THRESHOLD || Math.abs(gesture.vy) > 0.5;

        if (pastThreshold) {
          const direction = gesture.dy < 0 ? -1 : 1; // -1 = up (next), 1 = down (previous)
          const isInvalidDown = direction > 0 && isFirstCard;

          if (isInvalidDown) {
            // Smoothly animate back to center with ease-out timing (no bounce)
            Animated.timing(position, {
              toValue: { x: 0, y: 0 },
              duration: 200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start();
            return;
          }

          isAnimatingOutRef.current = true;
          Animated.timing(position, {
            toValue: { x: 0, y: direction * SCREEN_HEIGHT * 1.2 },
            duration: SWIPE_OUT_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            isAnimatingOutRef.current = false; // Reset to avoid freezing
            onSwipe(direction < 0 ? "up" : "down");
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

  // Fades a "BACK" badge in while dragging down (dy > 0)
  const backBadgeOpacity = position.y.interpolate({
    inputRange: [0, 40, 140],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  // Fades a "NEXT" badge in while dragging up (dy < 0)
  const nextBadgeOpacity = position.y.interpolate({
    inputRange: [-140, -40, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  if (!card) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: position.y },
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
          <Text style={styles.tapHint}>Tap to reveal answer · Swipe up/down to navigate</Text>
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
            Tap to see question · Swipe up/down to navigate
          </Text>
        </Animated.View>
      </Pressable>

      {/* Swipe affordance — sits above both faces, ignores touches */}
      <View style={styles.swipeHintRow} pointerEvents="none">
        <Text style={styles.swipeHintText}>Swipe up for next • down for back</Text>
      </View>

      {/* "BACK" badge — fades in while dragging down */}
      <Animated.View
        style={[
          styles.badge,
          styles.backBadge,
          { opacity: backBadgeOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.backBadgeText}>BACK</Text>
      </Animated.View>

      {/* "NEXT" badge — fades in while dragging up */}
      <Animated.View
        style={[
          styles.badge,
          styles.forwardBadge,
          { opacity: nextBadgeOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.forwardBadgeText}>NEXT</Text>
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
  backBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  backBadgeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  forwardBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  forwardBadgeText: {
    color: "#ffffff",
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
});