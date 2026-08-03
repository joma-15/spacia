import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "../constants/theme";
import { CalendarDay } from "../types";
import { WEEKDAY_LABELS, currentMonthLabel } from "../utils/date";

interface CalendarCardProps {
  days: CalendarDay[];
}

const STATUS_STYLE: Record<
  CalendarDay["status"],
  { backgroundColor: string; textColor: string; borderColor?: string }
> = {
  completed: { backgroundColor: colors.calendarCompleted, textColor: colors.textInverse },
  missed: { backgroundColor: colors.calendarMissed, textColor: colors.textTertiary },
  today: { backgroundColor: colors.calendarToday, textColor: colors.textInverse },
  future: { backgroundColor: colors.calendarFuture, textColor: colors.textTertiary },
  inactive: { backgroundColor: "transparent", textColor: colors.textTertiary },
};

export function CalendarCard({ days }: CalendarCardProps) {
  // Pad the front of the grid so day 1 lands on the correct weekday column.
  const firstDate = days.length > 0 ? new Date(days[0].date) : new Date();
  const leadingBlanks = firstDate.getDay();
  const paddedDays: (CalendarDay | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...days,
  ];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{currentMonthLabel()}</Text>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {paddedDays.map((day, index) => {
          if (!day) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const style = STATUS_STYLE[day.status];
          return (
            <View key={day.date} style={styles.cell}>
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: style.backgroundColor },
                  day.status === "future" && styles.dayCircleOutline,
                ]}
              >
                <Text style={[styles.dayLabel, { color: style.textColor }]}>{day.day}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <LegendItem color={colors.calendarCompleted} label="Completed" />
        <LegendItem color={colors.calendarMissed} label="Missed" />
        <LegendItem color={colors.calendarToday} label="Today" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <MaterialCommunityIcons name="circle" size={8} color={color} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const CELL_SIZE = "14.28%"; // 100 / 7 columns

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.soft,
  },
  headerRow: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: "center",
    ...typography.caption,
    color: colors.textTertiary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  dayCircle: {
    width: "78%",
    height: "78%",
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleOutline: {
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: "none",
  },
});
