import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME } from "../../library/theme";
import type { DayOfWeek, ScheduleType } from "../../library/types";
import ScheduleSummaryCard from "./ScheduleSummaryCard";

interface Props {
  folderName: string;
  cardCount: number;
  scheduleType: ScheduleType;
  customDays: DayOfWeek[];
  time: string;
  durationMinutes: number;
  intervalMinutes: number;
  shuffle: boolean;
}

const ReviewStep: React.FC<Props> = (props) => (
  <View style={styles.wrap}>
    <Text style={styles.heading}>Review</Text>
    <Text style={styles.subtitle}>
      Double check everything looks right before saving.
    </Text>
    <ScheduleSummaryCard {...props} />
  </View>
);

export default ReviewStep;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 6,
  },
  subtitle: { fontSize: 13, color: THEME.textMuted, marginBottom: 16 },
});
