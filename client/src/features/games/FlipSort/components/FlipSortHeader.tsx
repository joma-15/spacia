/**
 * FlipSortHeader.tsx
 * ─────────────────────────────────────────────
 * Top row of the Flip & Sort screen: back button + progress/folder info + change folder button.
 */

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  currentNumber: number;
  totalCards: number;
  folderName: string;
  onBackPress: () => void;
  onChangeFolderPress: () => void;
}

const FlipSortHeader: React.FC<Props> = ({
  currentNumber,
  totalCards,
  folderName,
  onBackPress,
  onChangeFolderPress,
}) => (
  <View style={styles.headerContainer}>
    <View style={styles.row}>
      {/* ── Back button ── */}
      <Pressable onPress={onBackPress} style={styles.circleButton} hitSlop={8}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textPrimary} />
      </Pressable>

      {/* ── Title block: Card X of Y and Folder Name ── */}
      <View style={styles.titleContainer}>
        <Text style={styles.progressText}>
          Card {currentNumber} of {totalCards}
        </Text>
        <Text style={styles.folderText} numberOfLines={1}>
          {folderName}
        </Text>
      </View>

      {/* ── Choose Another Folder button ── */}
      <Pressable onPress={onChangeFolderPress} style={styles.changeFolderButton} hitSlop={8}>
        <MaterialCommunityIcons name="folder-swap-outline" size={18} color={COLORS.primary} />
        <Text style={styles.changeFolderText}>Change</Text>
      </Pressable>
    </View>
  </View>
);

export default FlipSortHeader;

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.exitButtonBg,
    alignItems: "center",
    justifyContent: "center",
  },
  changeFolderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.exitButtonBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  changeFolderText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  progressText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  folderText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
