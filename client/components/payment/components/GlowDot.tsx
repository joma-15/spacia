/**
 * GlowDot.tsx
 * ─────────────────────────────────────────────
 * A tiny glowing circle used as a bullet point
 * next to each feature item in PerkSection.
 *
 * Accepts a color so it can match the parent's accent color.
 */

import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  /** The fill color of the dot — also used for the glow shadow */
  color: string;
}

const GlowDot: React.FC<Props> = ({ color }) => (
  <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
);

export default GlowDot;

const styles = StyleSheet.create({
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    // Shadow creates the "glow" effect around the dot
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius:  3,
    elevation: 2,  // Android shadow
  },
});