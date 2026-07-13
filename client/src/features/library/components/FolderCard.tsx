/**
 * FolderCard.tsx
 * ─────────────────────────────────────────────
 * Displays a single subject folder in the grid.
 *
 * Shows:
 *  - A colored folder icon (tab + body)
 *  - The subject name
 *  - How many cards are inside
 *  - An ✕ button to delete the folder
 *
 * It does NOT manage any state — it just receives data and calls
 * back to the parent when something happens (delete, press).
 */

import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "../theme";
import type { Folder } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  folder: Folder;
  /** Called when the user confirms deletion of this folder */
  onDelete: (id: string) => void;
  /** Called when the user taps the card (navigates into the folder) */
  onPress: () => void;
}

const FolderCard: React.FC<Props> = ({ folder, onDelete, onPress }) => {
  const { subject, cardCount, accentColor } = folder;

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Show a native confirmation dialog before deleting.
   * We ask first so the user can't accidentally wipe a folder.
   */
  const handleDeletePress = (): void => {
    Alert.alert("Delete Folder", `Remove "${subject}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(folder.id),
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, THEME.cardShadow]}
      onPress={onPress}
    >
      {/* ── ✕ delete button (top-right corner) ── */}
      <TouchableOpacity
        style={styles.deleteBtn}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        onPress={handleDeletePress}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>

      {/* ── Folder icon: a colored "tab" sitting on top of the folder body ── */}
      <View style={styles.iconWrap}>
        <View style={[styles.folderTab, { backgroundColor: accentColor }]} />
        <View
          style={[
            styles.folderBody,
            {
              backgroundColor: accentColor + "28",
              borderColor: accentColor + "55",
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.folderEmoji, { color: accentColor }]}>
            <MaterialCommunityIcons
              name="folder-open"
              size={25}
              color="yellow"
            />
          </Text>
        </View>
      </View>

      {/* ── Subject name ── */}
      <Text style={styles.title}>{subject}</Text>

      {/* ── Card count badge ── */}
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: accentColor + "22",
            borderColor: accentColor + "55",
          },
        ]}
      >
        <Text style={[styles.countText, { color: accentColor }]}>
          {cardCount} cards
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default FolderCard;

const styles = StyleSheet.create({
  card: {
    width: "47%",
    backgroundColor: THEME.bgCard,
    borderRadius: THEME.radiusMd,
    padding: 16,
    paddingTop: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  deleteBtn: { position: "absolute", top: 10, right: 12, zIndex: 1 },
  deleteBtnText: { fontSize: 13, color: THEME.textMuted, fontWeight: "700" },

  iconWrap: { marginTop: 6, marginBottom: 14, alignSelf: "flex-start" },
  folderTab: {
    width: 28,
    height: 8,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: -1,
    opacity: 0.85,
  },
  folderBody: {
    width: 62,
    height: 48,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  folderEmoji: { fontSize: 22 },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 6,
  },

  countBadge: {
    alignSelf: "flex-start",
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
  },
  countText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
});
