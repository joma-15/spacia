import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { Folder } from "../types";
import { computeFolderProgress } from "../utils/calculations";
import { relativeDayLabel } from "../utils/date";
import { ProgressBar } from "./ProgressBar";

interface FolderCardProps {
  folder: Folder;
  onPressMenu?: (folder: Folder) => void;
}

export function FolderCard({ folder, onPressMenu }: FolderCardProps) {
  const { masteryPercent } = computeFolderProgress(folder);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${folder.color}1F` }]}>
          <MaterialCommunityIcons
            name={folder.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={20}
            color={folder.color}
          />
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => onPressMenu?.(folder)}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {folder.title}
      </Text>
      <Text style={styles.subtitle}>
        {folder.totalCards} cards · {folder.lastStudied ? relativeDayLabel(folder.lastStudied) : "No recent study"}
      </Text>

      <View style={styles.progressRow}>
        <ProgressBar percent={masteryPercent} height={6} fillColor={folder.color} />
        <Text style={styles.masteryLabel}>{masteryPercent}% mastered</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xxs,
    ...shadow.soft,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    padding: spacing.xxs,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: spacing.xxs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: "none",
    marginBottom: spacing.xs,
  },
  progressRow: {
    gap: spacing.xxs,
  },
  masteryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "none",
  },
});
