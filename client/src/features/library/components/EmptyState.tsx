/**
 * EmptyState.tsx
 * ─────────────────────────────────────────────
 * Shown in place of the folder grid when there are no folders to display.
 *
 * There are TWO empty states:
 *  1. User is searching  → "No results for X" message
 *  2. No folders at all  → "No subjects yet" + a Create Folder button
 *
 * Pure display component — passes the "Create" action up to the parent.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "../theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  /** What the user has typed in the search bar (empty string if not searching) */
  searchQuery: string;
  /** Called when the user taps "Create Folder" in the empty state */
  onCreatePress: () => void;
}

const EmptyState: React.FC<Props> = ({ searchQuery, onCreatePress }) => {
  // ── Search empty state ─────────────────────────────────────────────────
  if (searchQuery.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>No results for "{searchQuery}"</Text>
        <Text style={styles.subtitle}>Try a different search term.</Text>
      </View>
    );
  }

  // ── No folders at all ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>
        <MaterialCommunityIcons
        name="folder-open"
        color="yellow"
        size={100}
        />
      </Text>
      <Text style={styles.title}>No subjects yet.</Text>
      <Text style={styles.subtitle}>Tap ＋ below to create your first folder.</Text>

      <TouchableOpacity style={styles.createBtn} onPress={onCreatePress}>
        <Text style={styles.createBtnText}>＋ Create Folder</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 52, marginBottom: 22 },
  icon:      { fontSize: 44, marginBottom: 14 },
  title:     { color: THEME.textWhite, fontSize: 17, fontWeight: "700", marginBottom: 6 },
  subtitle:  { color: THEME.textMuted, fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  createBtn: {
    backgroundColor: THEME.primaryDim, paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: THEME.radiusFull, borderWidth: 1, borderColor: THEME.primary,
  },
  createBtnText: { color: THEME.primary, fontWeight: "700", fontSize: 14 },
});