/**
 * PageHeader.tsx
 * ─────────────────────────────────────────────
 * The top section of the payment screen.
 *
 * Shows:
 *  - Crown emoji + "PREMIUM" gold badge
 *  - Main headline ("Unlock Your Full Potential")
 *  - Supporting subheadline
 *
 * Receives the fade animation value from the parent hook
 * so the entrance animation is controlled centrally.
 */

import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";

interface Props {
  /** Animated opacity value — drives the fade-in entrance */
  fadeAnim: Animated.Value;
  /** True when screen width >= 768px — increases font size */
  isTablet: boolean;
}

const PageHeader: React.FC<Props> = ({ fadeAnim, isTablet }) => (
  <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

    {/* ── Crown + PREMIUM badge row ── */}
    <View style={styles.badgeRow}>
      <Text style={styles.crown}>👑</Text>
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumBadgeText}>PREMIUM</Text>
      </View>
    </View>

    {/* ── Main headline ── */}
    <Text style={[styles.headline, isTablet && styles.headlineTablet]}>
      Unlock Your{"\n"}Full Potential
    </Text>

    {/* ── Supporting text ── */}
    <Text style={styles.subheadline}>
      Study smarter, not harder — with AI that{"\n"}works as hard as you do.
    </Text>
  </Animated.View>
);

export default PageHeader;

const styles = StyleSheet.create({
  container: { marginBottom: 28 },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  crown: { fontSize: 28 },
  premiumBadge: {
    backgroundColor: COLORS.goldDim, borderColor: COLORS.gold,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  premiumBadgeText: {
    color: COLORS.gold, fontSize: 11,
    fontWeight: "700", letterSpacing: 1.8,
  },

  headline: {
    color: COLORS.text, fontSize: 34, fontWeight: "800",
    lineHeight: 41, letterSpacing: -0.5, marginBottom: 10,
  },
  headlineTablet: { fontSize: 42, lineHeight: 50 },

  subheadline: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 16 },
});