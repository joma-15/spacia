import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../constants/theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onPressAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <Text style={styles.action} onPress={onPressAction}>
          {actionLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  action: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "700",
  },
});
