import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { Achievement } from "../types";
import { achievementProgressPercent } from "../utils/calculations";
import { ProgressBar } from "./ProgressBar";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const percent = achievementProgressPercent(achievement.progress, achievement.target);
  const isUnlocked = !achievement.locked;

  return (
    <View style={[styles.card, isUnlocked ? styles.cardUnlocked : styles.cardLocked]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isUnlocked ? colors.primarySoft : colors.surfaceHighlight },
        ]}
      >
        <MaterialCommunityIcons
          name={achievement.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color={isUnlocked ? colors.primary : colors.textTertiary}
        />
        {!isUnlocked && (
          <View style={styles.lockBadge}>
            <MaterialCommunityIcons name="lock" size={10} color={colors.textInverse} />
          </View>
        )}
      </View>

      <Text style={[styles.title, !isUnlocked && styles.titleLocked]} numberOfLines={1}>
        {achievement.title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {achievement.description}
      </Text>

      <View style={styles.progressRow}>
        <ProgressBar
          percent={percent}
          height={6}
          fillColor={isUnlocked ? colors.primary : colors.textTertiary}
        />
        <Text style={styles.progressText}>
          {achievement.progress}/{achievement.target}
        </Text>
      </View>
    </View>
  );
}

const CARD_WIDTH = 168;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xxs,
    ...shadow.soft,
  },
  cardUnlocked: {
    borderColor: colors.primaryMuted,
  },
  cardLocked: {
    borderColor: colors.border,
    opacity: 0.75,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.textTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  titleLocked: {
    color: colors.textSecondary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    minHeight: 32,
  },
  progressRow: {
    marginTop: spacing.xxs,
    gap: spacing.xxs,
  },
  progressText: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: "none",
  },
});
