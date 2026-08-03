import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../constants/theme";
import { StreakBadge } from "./StreakBadge";

interface HeaderProps {
  streakDays: number;
}

export function Header({ streakDays }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>WELCOME BACK,</Text>
      <Text style={styles.title}>Let's keep learning.</Text>
      <StreakBadge days={streakDays} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
});
