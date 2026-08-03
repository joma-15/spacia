import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { Challenge } from "../types";

interface ChallengeCardProps {
  challenge: Challenge;
  starting: boolean;
  onStart: () => void;
}

export function ChallengeCard({ challenge, starting, onStart }: ChallengeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="sword-cross" size={20} color={colors.xpGold} />
        </View>
        <View style={styles.rewardPill}>
          <MaterialCommunityIcons name="star-four-points" size={12} color={colors.xpGold} />
          <Text style={styles.rewardText}>{challenge.rewardXP} XP</Text>
        </View>
      </View>

      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description}>{challenge.description}</Text>

      <Text style={styles.progressText}>
        {challenge.progress}/{challenge.target} completed
      </Text>

      <Pressable
        onPress={onStart}
        disabled={challenge.completed || starting}
        style={({ pressed }) => [
          styles.button,
          challenge.completed && styles.buttonCompleted,
          pressed && !challenge.completed && styles.buttonPressed,
        ]}
      >
        {starting ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <>
            <MaterialCommunityIcons
              name={challenge.completed ? "check-bold" : "play"}
              size={16}
              color={colors.textInverse}
            />
            <Text style={styles.buttonText}>
              {challenge.completed ? "Challenge Complete" : "Start Challenge"}
            </Text>
          </>
        )}
      </Pressable>
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
    gap: spacing.xs,
    ...shadow.card,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  rewardText: {
    ...typography.caption,
    color: colors.xpGold,
    textTransform: "none",
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressText: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: "none",
    marginTop: spacing.xxs,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  buttonCompleted: {
    backgroundColor: colors.primaryMuted,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: "700",
  },
});
