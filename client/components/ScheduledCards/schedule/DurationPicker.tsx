import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../../library/theme";

interface Props {
  label: string;
  presets: { label: string; minutes: number }[];
  valueMinutes: number;
  onChange: (minutes: number) => void;
}

/** Row of preset chips, highlighting whichever matches the current value.
 *  Includes a "Custom" chip that reveals a text input so the user can type
 *  any number of minutes instead of being limited to the presets.
 *  Shared by the session-duration step and the pop-up interval step. */
const DurationPicker: React.FC<Props> = ({
  label,
  presets,
  valueMinutes,
  onChange,
}) => {
  // True when the current value doesn't match any preset, meaning the user
  // is (or should be) in "custom" mode.
  const isCustomValue = !presets.some((p) => p.minutes === valueMinutes);

  // Controls whether the custom input row is visible. Starts visible if the
  // incoming value is already a custom one (e.g. restored from saved state).
  const [showCustomInput, setShowCustomInput] = useState(isCustomValue);

  // Local text state for the input, so the user can freely type/delete
  // digits without us forcing a parsed number back into the field on every
  // keystroke (which would fight things like a leading "0" being cleared).
  const [customText, setCustomText] = useState(
    isCustomValue ? String(valueMinutes) : ""
  );

  const handleCustomChange = (text: string) => {
    // Only allow digits so the field can't end up with invalid characters.
    const digitsOnly = text.replace(/[^0-9]/g, "");
    setCustomText(digitsOnly);

    const parsed = parseInt(digitsOnly, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleCustomChipPress = () => {
    setShowCustomInput(true);
    // If there's already a valid custom number typed, re-apply it so the
    // parent's value matches the "Custom" selection right away.
    const parsed = parseInt(customText, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {presets.map((preset) => {
          const isSelected = !showCustomInput && valueMinutes === preset.minutes;
          return (
            <TouchableOpacity
              key={preset.label}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                setShowCustomInput(false);
                onChange(preset.minutes);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.chip, showCustomInput && styles.chipSelected]}
          onPress={handleCustomChipPress}
        >
          <Text
            style={[
              styles.chipText,
              showCustomInput && styles.chipTextSelected,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustomInput && (
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customText}
            onChangeText={handleCustomChange}
            keyboardType="number-pad"
            placeholder="Enter minutes"
            placeholderTextColor={THEME.textMuted}
            maxLength={4}
          />
          <Text style={styles.customSuffix}>min</Text>
        </View>
      )}
    </View>
  );
};

export default DurationPicker;

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    color: THEME.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: "700",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: THEME.radiusFull,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipSelected: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { color: THEME.textMid, fontWeight: "600", fontSize: 12 },
  chipTextSelected: { color: THEME.bg },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  customInput: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: THEME.textMid,
    fontSize: 12,
    fontWeight: "600",
    minWidth: 90,
  },
  customSuffix: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});