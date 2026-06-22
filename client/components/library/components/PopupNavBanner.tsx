/**
 * PopupNavBanner.tsx
 * ─────────────────────────────────────────────
 * A row banner that acts as a button, navigating to the
 * flashcard study-reminder / notification settings screen.
 *
 * This is a "dumb" / "presentational" component — it has zero state.
 * The parent owns navigation and just passes an onPress handler.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "../theme";

interface Props {
  /** Called when the banner is tapped — parent handles navigation */
  onPress: () => void;
}

const PopupNavBanner: React.FC<Props> = ({ onPress }) => (
  // Outer: shadow + ALWAYS-opaque background (Android elevation rule —
  // never put a transparent color on a view that also has elevation/shadow)
  <View style={[styles.shadowWrap, THEME.cardShadow]}>
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.75}>
      {/* ── Bell icon, themed for study reminders ── */}
      <View style={styles.iconBox}>
        <Text style={styles.icon}>🔔</Text>
      </View>

      {/* ── Description text ── */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Study reminders</Text>
        <Text style={styles.subtitle}>Get a flashcard pop-up notification when it's time to study</Text>
      </View>

      {/* ── Chevron, signals this row navigates somewhere ── */}
      <View style={styles.chevronBox}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  </View>
);

export default PopupNavBanner;

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: THEME.radiusMd,
    backgroundColor: THEME.bgElevated,
    marginBottom: 2,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: THEME.radiusMd,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    overflow: "hidden",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: THEME.radiusSm,
    backgroundColor: THEME.accentDim,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  icon: { fontSize: 18 },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: THEME.textWhite, marginBottom: 2 },
  subtitle: { fontSize: 12, color: THEME.textMuted, lineHeight: 16 },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: THEME.radiusFull,
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: { color: THEME.textMid, fontSize: 16, fontWeight: "700" },
});