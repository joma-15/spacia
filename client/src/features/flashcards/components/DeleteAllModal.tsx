/**
 * DeleteAllModal
 * Centered confirmation dialog shown before permanently deleting
 * all flashcards in the current deck.
 */

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  cardCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAllModal: React.FC<Props> = ({ visible, cardCount, onClose, onConfirm }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>

          {/* ── Icon ── */}
          <View style={styles.iconCircle}>
            {/* <Text style={styles.iconEmoji}>🗑️</Text> */}
            <MaterialCommunityIcons
            name="trash-can"
            size={22}
            color="white"
            style={styles.iconEmoji}
            />
          </View>

          <Text style={styles.title}>Delete All Cards?</Text>

          <Text style={styles.subtitle}>
            You're about to permanently remove{" "}
            <Text style={styles.highlight}>
              {cardCount} {cardCount === 1 ? "card" : "cards"}
            </Text>
            . This action cannot be undone.
          </Text>

          {/* ── Warning pill ── */}
          <View style={styles.warnPill}>
            <Text style={styles.warnText}>⚠ All progress will be lost</Text>
          </View>

          {/* ── Actions ── */}
          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>Delete All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteAllModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 28,
  },
  sheet: {
    width: "100%", backgroundColor: COLORS.surface, borderRadius: 20,
    padding: 24, alignItems: "center", borderWidth: 1,
    borderColor: COLORS.dangerBorder + "55",
  },
  iconCircle: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.dangerDim,
    borderWidth: 1.5, borderColor: COLORS.dangerBorder,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  iconEmoji: { fontSize: 24 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 14 },
  highlight: { color: "#f87171", fontWeight: "700" },
  warnPill: {
    backgroundColor: COLORS.dangerDim, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.dangerBorder + "88",
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 6,
  },
  warnText: { color: "#f87171", fontSize: 11, fontWeight: "600" },
  rowActions: { flexDirection: "row", gap: 8, marginTop: 12, width: "100%" },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: 10,
    paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },
  confirmBtn: {
    flex: 2, backgroundColor: COLORS.danger, borderRadius: 10,
    paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.dangerBorder,
  },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});