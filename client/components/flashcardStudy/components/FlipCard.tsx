/**
 * FlipCard.tsx
 * ─────────────────────────────────────────────
 * The main 3D-flipping flashcard.
 *
 * HOW THE FLIP WORKS:
 * Both faces (front = question, back = answer) are stacked on top
 * of each other using `position: absolute`. We rotate each face
 * on the Y-axis so that as the front rotates away from the viewer,
 * the back rotates into view — like a real card flipping over.
 *
 * `backfaceVisibility: hidden` is the key trick that hides a face
 * once it's rotated past 90 degrees, so you never see "through" the card.
 */

import React from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { COLORS } from "../colors";
import type { Flashcard } from "../types";

const CARD_HEIGHT = 320;

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
}

const FlipCard: React.FC<Props> = ({
  card,
  showBack,
  frontInterpolate,
  backInterpolate,
  onFlip,
}) => (
  <Pressable onPress={onFlip} style={styles.container}>

    {/* ── FRONT FACE: the question ── */}
    <Animated.View
      style={[
        styles.card,
        styles.face,
        { transform: [{ rotateY: frontInterpolate }] },
      ]}
      // Disable touches on this face once it has rotated to the back,
      // so taps go to the correct (visible) face only.
      pointerEvents={showBack ? "none" : "auto"}
    >
      <Text style={styles.label}>QUESTION</Text>
      <Text style={styles.cardText}>{card.question}</Text>
      <Text style={styles.tapHint}>Tap card to reveal answer</Text>
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
      <Text style={styles.tapHint}>Tap card to see question</Text>
    </Animated.View>
  </Pressable>
);

export default FlipCard;

const styles = StyleSheet.create({
  container: { width: "100%", height: CARD_HEIGHT },
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
    // Hides this face once rotated past 90deg — this is what makes
    // the flip look like a real card instead of a transparent pane.
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
});