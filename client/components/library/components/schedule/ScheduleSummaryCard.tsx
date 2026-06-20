import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME } from "../../theme";
import type { DayOfWeek, ScheduleType } from "../../types";

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

const formatScheduleLabel = (type: ScheduleType, days: DayOfWeek[]): string => {
  if (type === "one_time") return "One Time";
  if (type === "daily") return "Daily";
  return days.length > 0 ? days.join(", ") : "Custom Days";
};

const formatDuration = (minutes: number): string =>
  minutes >= 60 ? `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)} hour(s)` : `${minutes} min`;

const ScheduleSummaryCard: React.FC<Props> = ({
  folderName, cardCount, scheduleType, customDays,
  time, durationMinutes, intervalMinutes, shuffle,
}) => (
  <View style={styles.card}>
    <Row label="Folder" value={folderName} />
    <Row label="Cards Selected" value={cardCount.toString()} />
    <Row label="Schedule" value={formatScheduleLabel(scheduleType, customDays)} />
    <Row label="Time" value={time} />
    <Row label="Duration" value={formatDuration(durationMinutes)} />
    <Row label="Interval" value={`Every ${intervalMinutes} min`} />
    <Row label="Shuffle" value={shuffle ? "Enabled" : "Disabled"} isLast />
  </View>
);

export default ScheduleSummaryCard;

const Row: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast }) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.bgCard, borderRadius: THEME.radiusMd,
    borderWidth: 1, borderColor: THEME.border, paddingHorizontal: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: THEME.border },
  label: { color: THEME.textMuted, fontSize: 13, fontWeight: "600" },
  value: { color: THEME.textWhite, fontSize: 13, fontWeight: "700" },
});