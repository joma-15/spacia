/**
 * FolderCard.tsx
 * ─────────────────────────────────────────────
 * Displays a single subject folder in the grid.
 *
 * Shows:
 *  - A colored folder icon (tab + body)
 *  - The subject name
 *  - A pencil button to rename the folder
 *  - An ✕ button to delete the folder
 *
 * It does NOT manage any state beyond the inline rename input.
 * It just receives data and calls back to the parent when
 * something happens (delete, press, rename).
 */

import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../theme";
import type { Folder } from "../types";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

interface Props {
  folder: Folder;
  /** Called when the user confirms deletion of this folder */
  onDelete: (id: string) => void;
  /** Called when the user renames this folder */
  onRename: (id: string, newSubject: string) => void;
  /** Called when the user taps the card (navigates into the folder) */
  onPress: () => void;
}

const FolderCard: React.FC<Props> = ({ folder, onDelete, onRename, onPress }) => {
  const { subject, accentColor } = folder;

  // ── Rename state ──────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subject);

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

  const handleEditPress = (): void => {
    setEditText(subject);
    setIsEditing(true);
  };

  const handleRenameConfirm = (): void => {
    const trimmed = editText.trim();
    if (!trimmed) {
      Alert.alert("Validation", "Folder name cannot be empty.");
      return;
    }
    onRename(folder.id, trimmed);
    setIsEditing(false);
  };

  const handleRenameCancel = (): void => {
    setEditText(subject);
    setIsEditing(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TouchableOpacity
      activeOpacity={isEditing ? 1 : 0.8}
      style={[styles.card, THEME.cardShadow]}
      onPress={isEditing ? undefined : onPress}
    >
      {/* ── Top-right action buttons ── */}
      <View style={styles.topActions}>
        {/* Pencil / edit button */}
        <TouchableOpacity
          style={styles.iconBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          onPress={handleEditPress}
        >
          <MaterialIcons name="edit" size={14} color={THEME.textMuted} />
        </TouchableOpacity>

        {/* ✕ delete button */}
        <TouchableOpacity
          style={styles.iconBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          onPress={handleDeletePress}
        >
          <MaterialIcons name="close" size={14} color={THEME.textMuted} />
        </TouchableOpacity>
      </View>

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
              size={20}
              color="yellow"
            />
          </Text>
        </View>
      </View>

      {/* ── Subject name (or inline edit input) ── */}
      {isEditing ? (
        <View style={styles.editRow}>
          <TextInput
            style={[styles.editInput, { borderColor: accentColor }]}
            value={editText}
            onChangeText={setEditText}
            autoFocus
            onSubmitEditing={handleRenameConfirm}
            returnKeyType="done"
            selectTextOnFocus
          />
          <TouchableOpacity onPress={handleRenameConfirm} style={[styles.editConfirmBtn, { backgroundColor: accentColor }]}>
            <MaterialIcons name="check" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRenameCancel} style={styles.editCancelBtn}>
            <MaterialIcons name="close" size={14} color={THEME.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.title} numberOfLines={1}>{subject}</Text>
      )}

    </TouchableOpacity>
  );
};

export default FolderCard;

const styles = StyleSheet.create({
  card: {
    width: "47%",
    backgroundColor: THEME.bgCard,
    borderRadius: THEME.radiusMd,
    minHeight: 112,
    padding: 10,
    position: "relative",
    borderWidth: 1,
    borderColor: THEME.border,
  },

  topActions: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    gap: 4,
    zIndex: 1,
  },
  iconBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  iconWrap: { marginTop: 2, marginBottom: 7, alignSelf: "flex-start" },
  folderTab: {
    width: 22,
    height: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: -1,
    opacity: 0.85,
  },
  folderBody: {
    width: 48,
    height: 36,
    borderRadius: 7,
    borderTopLeftRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  folderEmoji: { fontSize: 18 },

  title: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 5,
  },

  // Inline rename
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  editInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textWhite,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: THEME.bg,
  },
  editConfirmBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  editCancelBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

});
