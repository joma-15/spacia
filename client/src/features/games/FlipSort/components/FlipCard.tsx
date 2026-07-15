/**
 * FlipCard.tsx
 * ─────────────────────────────────────────────
 * The main 3D-flipping flashcard.
 */

import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
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
