import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons name="fire" size={20} color={colors.streakFlame} />
      <Text style={styles.text}>
        {days} Day Streak
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xxs,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    ...shadow.soft,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "700",
  },
});
