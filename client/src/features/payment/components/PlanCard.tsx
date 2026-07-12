/**
 * PlanCard.tsx
 * ─────────────────────────────────────────────
 * A tappable card representing one subscription plan (Monthly or Annual).
 *
 * Shows:
 *  - A radio button (filled when selected)
 *  - Plan label + price
 *  - Optional "per month" breakdown (used on annual plan)
 *  - Optional badge in the top-right corner (e.g. "SAVE 17%")
 *
 * Plays a small scale bounce animation when tapped.
 */

import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../colors";

interface Props {
  label: string;
  price: string;
  /** Small text shown below the price, e.g. "$2.08/mo" — annual plan only */
  perMonth?: string;
  /** Corner badge text, e.g. "SAVE 17%" — optional */
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<Props> = ({
  label,
  price,
  perMonth,
  badge,
  selected,
  onSelect,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Tap animation ─────────────────────────────────────────────────────────

  /** Briefly shrinks the card on press then springs back */
  const handlePress = (): void => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80,  useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onSelect();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.wrapper}>
      <Animated.View style={[
        styles.card,
        selected && styles.cardSelected,
        { transform: [{ scale: scaleAnim }] },
      ]}>

        {/* ── "SAVE X%" badge in top-right corner ── */}
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {/* ── Radio button indicator ── */}
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>

        {/* ── Plan name + price ── */}
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {label}
        </Text>
        <Text style={[styles.price, selected && styles.priceSelected]}>
          {price}
        </Text>

        {/* ── Per-month breakdown (annual only) ── */}
        {perMonth && <Text style={styles.perMonth}>{perMonth}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default PlanCard;

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: "relative",
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.cardHighlight,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  badge: {
    position: "absolute", top: -1, right: -1,
    backgroundColor: COLORS.accent,
    borderBottomLeftRadius: 10, borderTopRightRadius: 15,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: COLORS.bg, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },

  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.textDim,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  radioSelected: { borderColor: COLORS.accent },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.accent },

  label: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  labelSelected: { color: COLORS.accentText },

  price: { color: COLORS.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  priceSelected: { color: COLORS.white },

  perMonth: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});