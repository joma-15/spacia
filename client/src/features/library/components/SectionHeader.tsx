/**
 * SectionHeader.tsx
 * ─────────────────────────────────────────────
 * A simple two-column row:
 *   Left  → "My Subjects" title
 *   Right → folder count + "Delete All" button
 *
 * Pure display component — no state, no logic.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { THEME } from "../theme";

interface Props {
  /** Number of folders currently visible (after search filtering) */
  count: number;
  /** Called when the user taps "Delete All" */
  onDeleteAll?: () => void;
}

const SectionHeader: React.FC<Props> = ({ count, onDeleteAll }) => (
  <View style={styles.row}>
    <View style={styles.left}>
      <Text style={styles.title}>My Subjects</Text>
      {/* Correct singular/plural: "1 folder" vs "3 folders" */}
      <Text style={styles.count}>
        {count} {count === 1 ? "folder" : "folders"}
      </Text>
    </View>

    {count > 0 && onDeleteAll && (
      <TouchableOpacity style={styles.deleteAllBtn} onPress={onDeleteAll} activeOpacity={0.75}>
        <MaterialIcons name="delete-sweep" size={16} color="#f87171" />
        <Text style={styles.deleteAllText}>Delete All</Text>
      </TouchableOpacity>
    )}
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
  left: {
    gap: 2,
  },
  title: { fontSize: 20, fontWeight: "700", color: THEME.textWhite, letterSpacing: 0.1 },
  count: { fontSize: 12, fontWeight: "600", color: THEME.textMuted },

  deleteAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(248,113,113,0.10)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.30)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteAllText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});