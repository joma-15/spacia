/**
 * FeatureDivider.tsx
 * ─────────────────────────────────────────────
 * A horizontal rule with a centered text label.
 * Used to separate the plan cards from the features list.
 *
 * Looks like:  ─────── Everything included ───────
 *
 * Pure display component — no props, no state.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";

const FeatureDivider: React.FC = () => (
  <View style={styles.row}>
    <View style={styles.line} />
    <Text style={styles.label}>Everything included</Text>
    <View style={styles.line} />
  </View>
);

export default FeatureDivider;

const styles = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  line:  { flex: 1, height: 1, backgroundColor: COLORS.border },
  label: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
});