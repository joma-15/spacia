/**
 * PremiumModal
 * Bottom-sheet upsell shown when a user taps the AI Generate button
 * without a premium subscription. Lists premium feature highlights
 * and provides an upgrade CTA.
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
import { COLORS, PREMIUM_FEATURES } from "../constants";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<Props> = ({ visible, onClose, onUpgrade }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      {/* Tap outside to dismiss */}
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
            <View style={styles.handle} />

            {/* ── Crown icon ── */}
            <View style={styles.crownCircle}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>

            <Text style={styles.title}>Premium Feature</Text>
            <Text style={styles.subtitle}>
              Generate flashcards instantly from any topic using AI.{"\n"}
              Upgrade your plan to unlock this feature.
            </Text>

            {/* ── Feature list ── */}
            <View style={styles.featureBox}>
              {PREMIUM_FEATURES.map((f, i) => (
                <View
                  key={i}
                  style={[
                    styles.featureItem,
                    i < PREMIUM_FEATURES.length - 1 && styles.featureDivider,
                  ]}
                >
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* ── CTAs ── */}
            <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
              <Text style={styles.upgradeBtnText}>👑 Upgrade to Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
              <Text style={styles.laterBtnText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default PremiumModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 22, paddingBottom: 40, alignItems: "center",
  },
  handle: {
    width: 36, height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, alignSelf: "center", marginBottom: 18,
  },
  crownCircle: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.premiumGoldDim,
    borderWidth: 2, borderColor: COLORS.premiumGold,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  crownEmoji: { fontSize: 28 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 7, textAlign: "center" },
  subtitle: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  featureBox: {
    width: "100%", backgroundColor: "#162a1e", borderRadius: 12,
    borderWidth: 1, borderColor: "#1a5c35", paddingHorizontal: 14, marginBottom: 20,
  },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  featureDivider: { borderBottomWidth: 1, borderBottomColor: "#1a3a28" },
  featureIcon: { color: COLORS.primary, fontSize: 14, width: 18, textAlign: "center" },
  featureText: { color: COLORS.text, fontSize: 13, flex: 1, lineHeight: 19 },
  upgradeBtn: {
    width: "100%", backgroundColor: "#5b21b6", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.premiumPurpleBorder, marginBottom: 10,
  },
  upgradeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  laterBtn: {
    width: "100%", paddingVertical: 11, alignItems: "center",
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  laterBtnText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },
});