import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DAYS_OF_WEEK } from "../../library/constants";
import { THEME } from "../../library/theme";
import type { DayOfWeek } from "../../library/types";

interface Props {
  selectedDays: DayOfWeek[];
  onToggle: (day: DayOfWeek) => void;
}

const DayPicker: React.FC<Props> = ({ selectedDays, onToggle }) => (
  <View style={styles.row}>
    {DAYS_OF_WEEK.map((day) => {
      const isSelected = selectedDays.includes(day);
      return (
        <TouchableOpacity
          key={day}
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() => onToggle(day)}
        >
          <Text
            style={[styles.chipText, isSelected && styles.chipTextSelected]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default DayPicker;

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    width: 44,
    paddingVertical: 10,
    borderRadius: THEME.radiusFull,
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipSelected: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { color: THEME.textMuted, fontWeight: "700", fontSize: 12 },
  chipTextSelected: { color: THEME.bg },
});
