/**
 * Header
 * Top bar containing:
 *   - Back navigation button
 *   - Subject + deck title
 *   - Optional "Clear All" chip (shown only when cards exist)
 *   - AI Generate chip
 *   - Add card (+) button
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  title: string;
  subtitle: string;
  hasCards: boolean;
  onAiGenerate: () => void;
  onAddCard: () => void;
  onDeleteAll: () => void;
}

const Header: React.FC<Props> = ({
  title,
  subtitle,
  hasCards,
  onAiGenerate,
  onAddCard,
  onDeleteAll,
}) => (
  <View style={styles.header}>

    {/* ── Back button ── */}
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => router.back()}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.backBtnIcon}>‹</Text>
    </TouchableOpacity>

    {/* ── Title block ── */}
    <View style={styles.titleBlock}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>

    {/* ── Action chips ── */}
    <View style={styles.actions}>
      {hasCards && (
        <TouchableOpacity style={styles.deleteChip} onPress={onDeleteAll} activeOpacity={0.75}>
          <Text style={styles.deleteChipText}><MaterialCommunityIcons
          name="trash-can"
          size={15}
          color="gray"
          />
          Clear</Text>
        </TouchableOpacity>
      )}

      {/* AI generate chip */}
      <TouchableOpacity style={styles.aiChip} onPress={onAiGenerate} activeOpacity={0.75}>
        <Text style={styles.aiChipStar}>✦</Text>
        <Text style={styles.aiChipText}>AI</Text>
        <View style={styles.aiChipCrown}>
          <Text style={styles.aiChipCrownText}>👑</Text>
        </View>
      </TouchableOpacity>

      {/* Add card button */}
      <TouchableOpacity style={styles.addBtn} onPress={onAddCard}>
        <Text style={styles.addBtnText}>＋</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default Header;

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  backBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  backBtnIcon: { color: COLORS.text, fontSize: 22, fontWeight: "300", lineHeight: 26, marginTop: -1 },
  titleBlock: { flex: 1 },
  subtitle: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 2 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteChip: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.dangerDim,
    borderWidth: 1, borderColor: COLORS.dangerBorder, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  deleteChipText: { color: "#f87171", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  aiChip: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.premiumPurple,
    borderWidth: 1, borderColor: COLORS.premiumPurpleBorder, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  aiChipStar: { color: COLORS.premiumPurpleText, fontSize: 11, fontWeight: "700" },
  aiChipText: { color: COLORS.premiumPurpleText, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  aiChipCrown: {
    position: "absolute", top: -8, right: -8, width: 18, height: 18,
    borderRadius: 9, backgroundColor: COLORS.premiumGold,
    borderWidth: 2, borderColor: COLORS.background,
    alignItems: "center", justifyContent: "center",
  },
  aiChipCrownText: { fontSize: 8, lineHeight: 12 },
  addBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 20, fontWeight: "300", lineHeight: 24 },
});