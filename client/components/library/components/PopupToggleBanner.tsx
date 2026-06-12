/**
 * PopupToggleBanner.tsx
 * ─────────────────────────────────────────────
 * A row banner with a toggle switch.
 * When enabled, flashcards will appear as a notification
 * whenever the user unlocks their device.
 *
 * This is a "dumb" / "presentational" component — it has zero state.
 * The parent passes in the current value and a callback for changes.
 */

import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { THEME } from "../theme";

interface Props {
  /** Whether the popup-on-unlock feature is currently on */
  enabled: boolean;
  /** Called with the new value whenever the user flips the switch */
  onToggle: (newValue: boolean) => void;
}

const PopupToggleBanner: React.FC<Props> = ({ enabled, onToggle }) => (
  <View style={styles.banner}>

    {/* ── Lock icon ── */}
    <View style={styles.iconBox}>
      <Text style={styles.icon}>🔒</Text>
    </View>

    {/* ── Description text ── */}
    <View style={styles.textBlock}>
      <Text style={styles.title}>Flashcards will pop up</Text>
      <Text style={styles.subtitle}>when you unlock your device</Text>
    </View>

    {/* ── Toggle switch ── */}
    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{ false: THEME.border, true: THEME.primaryDim }}
      thumbColor={enabled ? THEME.primary : THEME.textMuted}
      ios_backgroundColor={THEME.border}
    />
  </View>
);

export default PopupToggleBanner;

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    padding: 14,
    gap: 12,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 11,
    backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: THEME.border,
  },
  icon: { fontSize: 18 },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: THEME.textWhite, marginBottom: 2 },
  subtitle: { fontSize: 12, color: THEME.textMuted },
});