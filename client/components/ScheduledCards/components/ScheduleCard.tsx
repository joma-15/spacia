import React from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../../library/theme";
import type { Schedule } from "../../library/types";

interface Props {
  schedule: Schedule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  // onDuplicate: (id: string) => void;
  onEdit: (id: string) => void;
}

const scheduleLabel = (schedule: Schedule): string => {
  if (schedule.scheduleType === "one_time") return "One Time";
  if (schedule.scheduleType === "daily") return "Daily";
  return schedule.customDays.join(", ") || "Custom";
};

const ScheduleCard: React.FC<Props> = ({
  schedule,
  onToggle,
  onDelete,
  // onDuplicate,
  onEdit,
}) => {
  const confirmDelete = (): void => {
    Alert.alert("Delete Schedule", `Remove "${schedule.folderName} Review"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(schedule.id),
      },
    ]);
  };

  return (
    <View style={[styles.card, !schedule.enabled && styles.cardDisabled]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>📚 {schedule.folderName} Review</Text>
        <Switch
          value={schedule.enabled}
          onValueChange={() => onToggle(schedule.id)}
          trackColor={{ false: THEME.border, true: THEME.primaryDim }}
          thumbColor={schedule.enabled ? THEME.primary : THEME.textMuted}
        />
      </View>

      <Text style={styles.meta}>
        {scheduleLabel(schedule)} • {schedule.time}
      </Text>
      <Text style={styles.meta}>
        {schedule.cardIds.length} Cards • Every {schedule.intervalMinutes} min
      </Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => onEdit(schedule.id)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => onDuplicate(schedule.id)}>
          <Text style={styles.actionText}>Duplicate</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ScheduleCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: THEME.radiusMd,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  cardDisabled: { opacity: 0.5 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: THEME.textWhite,
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  meta: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionsRow: { flexDirection: "row", gap: 18, marginTop: 12 },
  actionText: { color: THEME.primary, fontWeight: "700", fontSize: 12 },
  deleteText: { color: THEME.folderRed },
});
