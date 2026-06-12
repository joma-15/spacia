/**
 * SectionHeader.tsx
 * ─────────────────────────────────────────────
 * A simple two-column row:
 *   Left  → "My Subjects" title
 *   Right → folder count (e.g. "3 folders")
 *
 * Pure display component — no state, no logic.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME } from "../theme";

interface Props {
  /** Number of folders currently visible (after search filtering) */
  count: number;
}

const SectionHeader: React.FC<Props> = ({ count }) => (
  <View style={styles.row}>
    <Text style={styles.title}>My Subjects</Text>
    {/* Correct singular/plural: "1 folder" vs "3 folders" */}
    <Text style={styles.count}>
      {count} {count === 1 ? "folder" : "folders"}
    </Text>
  </View>
);

export default SectionHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: "700", color: THEME.textWhite, letterSpacing: 0.1 },
  count: { fontSize: 12, fontWeight: "600", color: THEME.textMuted },
});