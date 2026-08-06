import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { ProgressBar } from "./ProgressBar";
import { Challenge } from "../types";

interface DailyGoalCardProps {
  challenge: Challenge;
  target: number;
  completed: number;
  percent: number;
  remaining: number;
  isComplete: boolean;
  message: string;
}

export function DailyGoalCard({
  challenge,
  target,
  completed,
  percent,
  remaining,
  isComplete,
  message,
}: DailyGoalCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={isComplete ? "check-circle" : "target"}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>TODAY'S GOAL</Text>
          <Text style={styles.title}>{challenge.description}</Text>
        </View>
        <Text style={styles.percentLabel}>{percent}%</Text>
      </View>

      <ProgressBar percent={percent} height={10} />

      <View style={styles.footerRow}>
        <Text style={styles.progressLabel}>
          {completed} / {target} completed
        </Text>
        {!isComplete && (
          <Text style={styles.remainingLabel}>{remaining} cards left</Text>
        )}
      </View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  percentLabel: {
    ...typography.h1,
    color: colors.primary,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  remainingLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginTop: spacing.xxs,
  },
});
