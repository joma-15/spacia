/**
 * FlipCard.tsx
 * ─────────────────────────────────────────────
 * The main 3D-flipping flashcard. Swipe left to mark as Review,
 * swipe right to mark as Understood, swipe up to Skip.
 *
 * TEXT READABILITY IMPROVEMENTS
 * ─────────────────────────────
 * • Font size shrinks dynamically based on text length so medium-length
 *   content still looks large and comfortable.
 * • For extremely long text the inner content area becomes scrollable so
 *   nothing is ever clipped or hidden.
 * • The card itself fills its parent container (flex: 1) rather than
 *   using a fixed pixel height, giving it more room on taller screens.
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../colors";
import type { Flashcard } from "../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD_X = SCREEN_WIDTH * 0.25;
// Use a fraction of the screen height so the threshold scales across device sizes.
const SWIPE_THRESHOLD_Y = SCREEN_HEIGHT * 0.12;
const SWIPE_OUT_DURATION = 220;

/**
 * Returns a font size that shrinks as the text gets longer.
 *
 * Short  (≤ 60 chars)  → 24 px  — large, prominent
 * Medium (≤ 130 chars) → 19 px  — comfortable
 * Long   (≤ 220 chars) → 15 px  — compact but readable
 * Very long (> 220)    → 13 px  — minimal; ScrollView enabled
 */
function getDynamicFontSize(text: string): number {
  const len = text?.length ?? 0;
  if (len <= 60) return 24;
  if (len <= 130) return 19;
  if (len <= 220) return 15;
  return 13;
}

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

  // Keep a mutable ref of the latest onSwipe callback to avoid stale closure in PanResponder
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

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
            onSwipeRef.current(isLeft ? "left" : "right");
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
            onSwipeRef.current("up");
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

  const questionFontSize = getDynamicFontSize(card.question);
  const answerFontSize = getDynamicFontSize(card.answer);
  // ScrollView is activated for very long text (font already at minimum).
  const questionScrollable = questionFontSize <= 13;
  const answerScrollable = answerFontSize <= 13;

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

          {/* Text area — scrollable for very long questions */}
          <ScrollView
            style={styles.textScrollArea}
            contentContainerStyle={styles.textScrollContent}
            showsVerticalScrollIndicator={questionScrollable}
            scrollEnabled={questionScrollable}
            // Prevent the scroll from being captured by the card's PanResponder
            // when scrolling is active, so the user can actually scroll the text.
            onStartShouldSetResponder={() => questionScrollable}
          >
            <Text
              style={[
                styles.cardText,
                { fontSize: questionFontSize, lineHeight: questionFontSize * 1.45 },
              ]}
            >
              {card.question}
            </Text>
          </ScrollView>

          <Text style={styles.tapHint}>Tap card to flip</Text>
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

          {/* Text area — scrollable for very long answers */}
          <ScrollView
            style={styles.textScrollArea}
            contentContainerStyle={styles.textScrollContent}
            showsVerticalScrollIndicator={answerScrollable}
            scrollEnabled={answerScrollable}
            onStartShouldSetResponder={() => answerScrollable}
          >
            <Text
              style={[
                styles.cardText,
                { fontSize: answerFontSize, lineHeight: answerFontSize * 1.45 },
              ]}
            >
              {card.answer}
            </Text>
          </ScrollView>

          <Text style={styles.tapHint}>
            Tap to flip · Swipe left to Review · Swipe right to Understood
          </Text>
        </Animated.View>
      </Pressable>

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
  // container and pressable fill whatever flex space the parent gives them.
  // The height is no longer fixed to a constant — the parent's cardContainer
  // (flex: 1) dictates the available space, which is naturally larger.
  container: { width: "100%", flex: 1 },
  pressable: { width: "100%", flex: 1 },
  card: {
    width: "100%",
    flex: 1,
    borderRadius: 24,
    backgroundColor: COLORS.cardFrontBg,
    borderWidth: 1,
    borderColor: COLORS.cardFrontBorder,
    // Top padding reserves space for the QUESTION/ANSWER label.
    // Bottom padding reserves space for the tap-hint text.
    paddingTop: 20,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginBottom: 12,
    alignSelf: "center",
  },
  labelBack: { color: COLORS.primary },
  // The scroll area fills all space between the label and the tap-hint.
  // Short content is vertically centred inside via flexGrow + justifyContent.
  textScrollArea: {
    flex: 1,
    width: "100%",
  },
  textScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  cardText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    textAlign: "center",
    // fontSize and lineHeight are applied as inline styles (dynamic per card)
  },
  tapHint: {
    position: "absolute",
    bottom: 14,
    left: 12,
    right: 12,
    color: COLORS.textDim,
    fontSize: 11,
    textAlign: "center",
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