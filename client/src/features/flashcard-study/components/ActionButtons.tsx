/**
 * ActionButtons.tsx
 * ─────────────────────────────────────────────
 * The "🔁 Review" and "✓ Understood" buttons at the bottom of the screen.
 *
 * Both buttons are disabled until the user has flipped the card —
 * this stops people from grading a card they haven't actually read.
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";

interface Props {
  /** Whether the card has been flipped — buttons are disabled until true */
  isFlipped: boolean;
  onReviewPress: () => void;
  onUnderstoodPress: () => void;
  /** Extra bottom padding to clear the device's home indicator */
  bottomInset: number;
}

const ActionButtons: React.FC<Props> = ({
  isFlipped,
  onReviewPress,
  onUnderstoodPress,
  bottomInset,
}) => (
  <View style={[styles.row, { paddingBottom: Math.max(bottomInset, 12) }]}>

    {/* ── Review button — orange, means "I need to see this again" ── */}
    <Pressable
      onPress={onReviewPress}
      disabled={!isFlipped}
      style={[styles.button, styles.reviewButton, !isFlipped && styles.disabled]}
    >
      <Text style={styles.reviewText}>🔁 Review</Text>
    </Pressable>

    {/* ── Understood button — green, means "I know this" ── */}
    <Pressable
      onPress={onUnderstoodPress}
      disabled={!isFlipped}
      style={[styles.button, styles.understoodButton, !isFlipped && styles.disabled]}
    >
      <Text style={styles.understoodText}>✓ Understood</Text>
    </Pressable>
  </View>
);

export default ActionButtons;

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginTop: 20 },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  disabled: { opacity: 0.45 },

  reviewButton: { backgroundColor: COLORS.reviewBg, borderColor: COLORS.reviewBorder },
  reviewText:   { color: COLORS.reviewText, fontWeight: "700", fontSize: 15 },

  understoodButton: { backgroundColor: COLORS.understoodBg, borderColor: COLORS.understoodBorder },
  understoodText:   { color: COLORS.understoodText, fontWeight: "700", fontSize: 15 },
});