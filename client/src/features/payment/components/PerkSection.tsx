/**
 * PerkSection.tsx
 * ─────────────────────────────────────────────
 * A single animated card showing one category of premium features.
 *
 * Uses MaterialCommunityIcons for all icons — both the section header
 * icon and each individual feature row icon.
 *
 * Animates in with a fade + slide-up when the component mounts.
 * The `delay` prop lets the parent stagger each card's entrance.
 */

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../colors";

interface Props {
  icon: string;
  title: string;
  items: { icon: string; label: string }[];
  /** Milliseconds to wait before starting the entrance animation */
  delay: number;
}

const PerkSection: React.FC<Props> = ({ icon, title, items, delay }) => {

  // ── Entrance animation refs ───────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.card,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>

      {/* ── Section heading ── */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={COLORS.accent}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* ── Feature bullet list ── */}
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={15}
            color={COLORS.accentText}
            style={styles.rowIcon}
          />
          <Text style={styles.item}>{item.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
};

export default PerkSection;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 9,
  },
  rowIcon: {
    width: 20,
    textAlign: "center",
  },
  item: {
    color: COLORS.textMuted,
    fontSize: 13.5,
    flex: 1,
    lineHeight: 19,
  },
});