import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME } from "../../theme";
import { WIZARD_STEPS } from "../../constants";

interface Props {
  currentStep: number; // 0-indexed
}

const WizardProgressBar: React.FC<Props> = ({ currentStep }) => (
  <View style={styles.row}>
    {WIZARD_STEPS.map((label, index) => {
      const isActive = index === currentStep;
      const isDone = index < currentStep;
      return (
        <View key={label} style={styles.stepWrap}>
          <View style={[styles.dot, isDone && styles.dotDone, isActive && styles.dotActive]}>
            <Text style={styles.dotText}>{isDone ? "✓" : index + 1}</Text>
          </View>
          <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          {index < WIZARD_STEPS.length - 1 && (
            <View style={[styles.line, isDone && styles.lineDone]} />
          )}
        </View>
      );
    })}
  </View>
);

export default WizardProgressBar;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stepWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  dot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: THEME.bgElevated, borderWidth: 1, borderColor: THEME.border,
    justifyContent: "center", alignItems: "center",
  },
  dotActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  dotDone: { backgroundColor: THEME.primaryDim, borderColor: THEME.primaryDim },
  dotText: { fontSize: 11, fontWeight: "700", color: THEME.textWhite },
  label: { fontSize: 10, color: THEME.textMuted, marginLeft: 6, fontWeight: "600" },
  labelActive: { color: THEME.textWhite },
  line: { flex: 1, height: 1, backgroundColor: THEME.border, marginHorizontal: 8 },
  lineDone: { backgroundColor: THEME.primaryDim },
});