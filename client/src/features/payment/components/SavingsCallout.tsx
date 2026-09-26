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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../colors";

const SavingsCallout: React.FC = () => (
  <View style={styles.banner}>
    <View style={styles.iconWrap}>
      <MaterialCommunityIcons name="tag-outline" size={15} color={COLORS.accentText} />
    </View>
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
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.borderGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: COLORS.accentText, fontSize: 13, fontWeight: "600" },
});