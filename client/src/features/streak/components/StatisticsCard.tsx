import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";

interface StatisticsCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  accentColor?: string;
}

export function StatisticsCard({
  icon,
  label,
  value,
  accentColor = colors.primary,
}: StatisticsCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}1F` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={accentColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  value: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  label: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: "uppercase",
  },
});
