/**
 * SavingsCallout.tsx
 * ─────────────────────────────────────────────
 * A small green banner shown ONLY when the annual plan is selected.
 * Reinforces the money-saving message to nudge the user toward annual.
 *
 * Pure display component — no state, no logic.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";

const SavingsCallout: React.FC = () => (
  <View style={styles.banner}>
    <Text style={styles.emoji}>🎉</Text>
    <Text style={styles.text}>You're saving $5.00 a year vs monthly!</Text>
  </View>
);

export default SavingsCallout;

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
  },
  emoji: { fontSize: 16 },
  text:  { color: COLORS.accentText, fontSize: 13, fontWeight: "600" },
});