/**
 * LoadingModal
 * Full-screen overlay with a spinner shown while AI flashcards
 * are being fetched from the backend.
 */

import React from "react";
import { Modal, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../constants";

interface Props {
  visible: boolean;
}

const LoadingModal: React.FC<Props> = ({ visible }) => (
  <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
    <View style={styles.overlay}>
      <View style={styles.sheet}>

        {/* ── Sparkle icon ── */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>✦</Text>
        </View>

        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
        <Text style={styles.title}>Generating Cards</Text>
        <Text style={styles.subtitle}>Fetching your flashcards via AI…</Text>

        {/* ── Animated dots ── */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.3 }]} />
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

export default LoadingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    backgroundColor: COLORS.surface, borderRadius: 22,
    paddingVertical: 36, paddingHorizontal: 32,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.border, minWidth: 220,
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.premiumPurple,
    borderWidth: 1.5, borderColor: COLORS.premiumPurpleBorder,
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  iconEmoji: { color: COLORS.premiumPurpleText, fontSize: 22, fontWeight: "700" },
  spinner: { marginBottom: 16 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 6, letterSpacing: -0.2 },
  subtitle: { color: COLORS.textMuted, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 18 },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
});