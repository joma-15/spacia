/**
 * PerkSection.tsx
 * ─────────────────────────────────────────────
 * A single animated card showing one category of premium features.
 *
 * Example:
 *   🤖 AI-Powered Learning
 *   • Unlimited AI Flashcard Generation
 *   • Generate up to 50 flashcards at once
 *   ...
 *
 * Animates in with a fade + slide-up when the component mounts.
 * The `delay` prop lets the parent stagger each card's entrance.
 */

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import GlowDot from "./GlowDot";
import { COLORS } from "../colors";

interface Props {
  emoji: string;
  title: string;
  items: string[];
  /** Milliseconds to wait before starting the entrance animation */
  delay: number;
}

const PerkSection: React.FC<Props> = ({ emoji, title, items, delay }) => {

  // ── Entrance animation refs ───────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;  // starts invisible
  const slideAnim = useRef(new Animated.Value(20)).current; // starts 20px lower

  useEffect(() => {
    // Run fade and slide simultaneously after the delay
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[
      styles.card,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>

      {/* ── Section heading ── */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* ── Feature bullet list ── */}
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <GlowDot color={COLORS.accent} />
          <Text style={styles.item}>{item}</Text>
        </View>
      ))}
    </Animated.View>
  );
};

export default PerkSection;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  emoji: { fontSize: 20 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  item: { color: COLORS.textMuted, fontSize: 13.5, flex: 1, lineHeight: 19 },
});