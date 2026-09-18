/**
 * AiHeader.tsx
 * ─────────────────────────────────────────────
 * Minimalist ChatGPT-style top bar for Spacia AI:
 * - Left: New Chat icon button
 * - Center: Minimalist Subject/Folder selector dropdown pill
 * - Right: Reserved space for the top header actions (Pro button + Profile)
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AI_THEME } from "../constants";
import { SelectedFolderContext } from "../types";

interface AiHeaderProps {
  selectedFolder: SelectedFolderContext;
  onOpenFolderModal: () => void;
  onNewChat: () => void;
}

export const AiHeader: React.FC<AiHeaderProps> = ({
  selectedFolder,
  onOpenFolderModal,
  onNewChat,
}) => {
  return (
    <View style={styles.container}>
      {/* ── Left: New Chat Icon Button ── */}
      <TouchableOpacity
        style={styles.newChatBtn}
        activeOpacity={0.75}
        onPress={onNewChat}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="New Chat"
      >
        <MaterialCommunityIcons
          name="square-edit-outline"
          size={20}
          color={AI_THEME.textMuted}
        />
      </TouchableOpacity>

      {/* ── Center: Minimalist Folder Selector Dropdown Pill ── */}
      <TouchableOpacity
        style={styles.folderPill}
        activeOpacity={0.75}
        onPress={onOpenFolderModal}
        accessibilityRole="button"
        accessibilityLabel="Select study folder"
      >
        <MaterialCommunityIcons
          name="folder-outline"
          size={14}
          color={selectedFolder.accentColor || AI_THEME.primary}
        />
        <Text style={styles.folderPillText} numberOfLines={1}>
          {selectedFolder.name}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={14}
          color={AI_THEME.textDim}
        />
      </TouchableOpacity>

      {/* ── Right: Reserved space so floating top actions (PRO + Profile) never overlap ── */}
      <View style={styles.rightSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AI_THEME.border,
    backgroundColor: AI_THEME.bg,
  },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  folderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AI_THEME.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    maxWidth: 150,
  },
  folderPillText: {
    color: AI_THEME.textWhite,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },
  rightSpacer: {
    width: 125, // leaves clear space for top-right PRO and Profile buttons
  },
});
