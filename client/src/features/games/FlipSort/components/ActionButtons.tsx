/**
 * ActionButtons.tsx
 * ─────────────────────────────────────────────
 * The "🔁 Review" and "✓ Understood" buttons at the bottom of the screen.
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
  /** Optional active status of the current card to highlight classifications */
  status?: "review" | "understood" | null;
}

const ActionButtons: React.FC<Props> = ({
  isFlipped,
  onReviewPress,
  onUnderstoodPress,
  bottomInset,
  status,
}) => (
  <View style={[styles.row, { paddingBottom: Math.max(bottomInset, 12) }]}>

    {/* ── Review button — orange, means "I need to see this again" ── */}
    <Pressable
      onPress={onReviewPress}
      disabled={!isFlipped}
      style={[
        styles.button,
        styles.reviewButton,
        !isFlipped && styles.disabled,
        status === "review" && styles.reviewActive,
      ]}
    >
      <Text style={styles.reviewText}>🔁 Review</Text>
    </Pressable>

    {/* ── Understood button — green, means "I know this" ── */}
    <Pressable
      onPress={onUnderstoodPress}
      disabled={!isFlipped}
      style={[
        styles.button,
        styles.understoodButton,
        !isFlipped && styles.disabled,
        status === "understood" && styles.understoodActive,
      ]}
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
  reviewActive: {
    borderWidth: 3,
    borderColor: COLORS.reviewText,
  },

  understoodButton: { backgroundColor: COLORS.understoodBg, borderColor: COLORS.understoodBorder },
  understoodText:   { color: COLORS.understoodText, fontWeight: "700", fontSize: 15 },
  understoodActive: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
});
