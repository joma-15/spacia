/**
 * CtaButton.tsx
 * ─────────────────────────────────────────────
 * The sticky "Start Plan" call-to-action button fixed above the nav bar.
 *
 * Features:
 *  - Slide + fade entrance animation (driven by parent hook)
 *  - Looping shimmer glow animation on the button itself
 *  - Loading spinner while purchase is processing
 *  - Tablet-aware sizing
 *  - Legal sub-text below the button
 */

import React from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../colors";

interface Props {
  label: string;
  loading: boolean;
  onPress: () => void;
  isTablet: boolean;
  /** How far from the bottom of the screen the button should sit */
  bottomOffset: number;
  /** Animated opacity — drives slide+fade entrance */
  buttonFade: Animated.Value;
  /** Animated Y position — drives slide+fade entrance */
  buttonSlide: Animated.Value;
  /** Animated opacity — drives the shimmer glow loop */
  shimmerOpacity: Animated.AnimatedInterpolation<number>;
  /** Horizontal padding — wider on tablets */
  horizontalPadding: number;
}

const CtaButton: React.FC<Props> = ({
  label,
  loading,
  onPress,
  isTablet,
  bottomOffset,
  buttonFade,
  buttonSlide,
  shimmerOpacity,
  horizontalPadding,
}) => (
  <Animated.View style={[
    styles.wrapper,
    {
      bottom:           bottomOffset,
      opacity:          buttonFade,
      transform:        [{ translateY: buttonSlide }],
      paddingHorizontal: horizontalPadding,
    },
  ]}>

    {/* ── Shimmer wrapper — gives the button a breathing glow ── */}
    <Animated.View style={{ opacity: shimmerOpacity, width: "100%" }}>
      <TouchableOpacity
        style={[styles.button, isTablet && styles.buttonTablet]}
        onPress={onPress}
        activeOpacity={0.88}
        disabled={loading}
      >
        {loading ? (
          /* ── Spinner shown while purchase processes ── */
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.sub}>7-day free trial · cancel anytime</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>

    {/* ── Legal disclaimer below the button ── */}
    <Text style={styles.legal}>Secure payment · Subscriptions auto-renew</Text>
  </Animated.View>
);

export default CtaButton;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0, right: 0,
    alignItems: "center",
    paddingTop: 12, paddingBottom: 10,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  button: {
    width: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 16, paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 16,
    elevation: 8,
  },
  buttonTablet: { paddingVertical: 18, borderRadius: 20 },
  label: { color: COLORS.bg, fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  sub:   { color: COLORS.accentDim, fontSize: 11, marginTop: 2, fontWeight: "500" },
  legal: { color: COLORS.textDim, fontSize: 11, marginTop: 8, textAlign: "center" },
});