import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DURATION_PRESETS, INTERVAL_PRESETS } from "../../library/constants";
import { THEME } from "../../library/theme";
import type { DayOfWeek, ScheduleType } from "../../library/types";
import DayPicker from "./DayPicker";
import DurationPicker from "./DurationPicker";

interface Props {
  scheduleType: ScheduleType;
  onScheduleTypeChange: (type: ScheduleType) => void;
  customDays: DayOfWeek[];
  onToggleDay: (day: DayOfWeek) => void;
  time: string; // "HH:mm"
  onTimeChange: (time: string) => void;
  durationMinutes: number;
  onDurationChange: (minutes: number) => void;
  intervalMinutes: number;
  onIntervalChange: (minutes: number) => void;
  shuffle: boolean;
  onShuffleChange: (value: boolean) => void;
}

const SCHEDULE_OPTIONS: { type: ScheduleType; label: string }[] = [
  { type: "one_time", label: "One Time" },
  { type: "daily", label: "Repeat Daily" },
  { type: "custom_days", label: "Custom Days" },
];

/** "HH:mm" -> Date, just so we can feed the native picker */
const timeStringToDate = (time: string): Date => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const ScheduleSettingsStep: React.FC<Props> = ({
  scheduleType,
  onScheduleTypeChange,
  customDays,
  onToggleDay,
  time,
  onTimeChange,
  durationMinutes,
  onDurationChange,
  intervalMinutes,
  onIntervalChange,
  shuffle,
  onShuffleChange,
}) => {
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  const handleTimeChange = (_event: unknown, date?: Date): void => {
    if (Platform.OS === "android") setPickerVisible(false);
    if (!date) return;
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    onTimeChange(`${hh}:${mm}`);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Schedule</Text>

      {/* ── Schedule type ── */}
      <Text style={styles.label}>Schedule Type</Text>
      <View style={styles.radioGroup}>
        {SCHEDULE_OPTIONS.map((option) => {
          const isSelected = scheduleType === option.type;
          return (
            <TouchableOpacity
              key={option.type}
              style={styles.radioRow}
              onPress={() => onScheduleTypeChange(option.type)}
            >
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Custom days (only when relevant) ── */}
      {scheduleType === "custom_days" && (
        <View style={styles.section}>
          <Text style={styles.label}>Days</Text>
          <DayPicker selectedDays={customDays} onToggle={onToggleDay} />
        </View>
      )}

      {/* ── Time picker ── */}
      <View style={styles.section}>
        <Text style={styles.label}>Notification Time</Text>
        <TouchableOpacity
          style={styles.timeBtn}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={styles.timeBtnText}>🕒 {time}</Text>
        </TouchableOpacity>
        {pickerVisible && (
          <DateTimePicker
            value={timeStringToDate(time)}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
          />
        )}
      </View>

      {/* ── Session duration ── */}
      <DurationPicker
        label="Session Duration"
        presets={DURATION_PRESETS}
        valueMinutes={durationMinutes}
        onChange={onDurationChange}
      />

      {/* ── Pop-up interval ── */}
      <DurationPicker
        label="Notification Frequency"
        presets={INTERVAL_PRESETS}
        valueMinutes={intervalMinutes}
        onChange={onIntervalChange}
      />

      {/* ── Shuffle toggle ── */}
      <View style={styles.shuffleRow}>
        <Text style={styles.shuffleText}>Shuffle Flashcards</Text>
        <Switch
          value={shuffle}
          onValueChange={onShuffleChange}
          trackColor={{ false: THEME.border, true: THEME.primaryDim }}
          thumbColor={shuffle ? THEME.primary : THEME.textMuted}
        />
      </View>
    </View>
  );
};

export default ScheduleSettingsStep;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 16,
  },
  label: {
    color: THEME.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: "700",
  },
  section: { marginTop: 18 },

  radioGroup: { gap: 12 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.borderBright,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: { borderColor: THEME.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.primary,
  },
  radioText: { color: THEME.textWhite, fontWeight: "600", fontSize: 14 },

  timeBtn: {
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  timeBtnText: { color: THEME.textWhite, fontSize: 22, fontWeight: "700" },

  shuffleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  shuffleText: { color: THEME.textWhite, fontWeight: "700", fontSize: 14 },
});
