/**
 * StudyHeader.tsx
 * ─────────────────────────────────────────────
 * Top row of the study screen: exit button + "Card X of Y" counter.
 *
 * Pure display component — the exit confirmation logic lives
 * in the parent screen, this just triggers the callback.
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";

interface Props {
  /** 1-based card number to display, e.g. "Card 2 of 10" */
  currentNumber: number;
  totalCards: number;
  /** Called when the ✕ button is tapped */
  onExitPress: () => void;
}

const StudyHeader: React.FC<Props> = ({ currentNumber, totalCards, onExitPress }) => (
  <View style={styles.row}>

    {/* ── ✕ exit button ── */}
    <Pressable onPress={onExitPress} style={styles.exitButton}>
      <Text style={styles.exitIcon}>✕</Text>
    </Pressable>

    {/* ── "Card X of Y" counter ── */}
    <Text style={styles.progressText}>
      Card {currentNumber} of {totalCards}
    </Text>

    {/* ── Invisible spacer to keep the counter perfectly centered ── */}
    <View style={styles.spacer} />
  </View>
);

export default StudyHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  exitButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.exitButtonBg,
    alignItems: "center", justifyContent: "center",
  },
  exitIcon: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  progressText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  // Matches the width of the exit button so the counter text
  // stays visually centered in the row.
  spacer: { width: 36 },
});