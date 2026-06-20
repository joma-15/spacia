import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "../../theme";

interface Props {
  label: string;
  presets: { label: string; minutes: number }[];
  valueMinutes: number;
  onChange: (minutes: number) => void;
}

/** Row of preset chips, highlighting whichever matches the current value.
 *  Shared by the session-duration step and the pop-up interval step. */
const DurationPicker: React.FC<Props> = ({ label, presets, valueMinutes, onChange }) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>
      {presets.map((preset) => {
        const isSelected = valueMinutes === preset.minutes;
        return (
          <TouchableOpacity
            key={preset.label}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onChange(preset.minutes)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default DurationPicker;

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    color: THEME.textMuted, fontSize: 11, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 8, fontWeight: "700",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: THEME.radiusFull,
    backgroundColor: THEME.bgElevated, borderWidth: 1, borderColor: THEME.border,
  },
  chipSelected: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { color: THEME.textMid, fontWeight: "600", fontSize: 12 },
  chipTextSelected: { color: THEME.bg },
});