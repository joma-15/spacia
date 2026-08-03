import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../constants/theme";

interface QuoteCardProps {
  quote: string;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <View style={styles.card}>
      <MaterialCommunityIcons name="format-quote-open" size={22} color={colors.primary} />
      <Text style={styles.quote}>{quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  quote: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 21,
  },
});
