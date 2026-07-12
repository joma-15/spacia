/**
 * ProgressBar.tsx
 * ─────────────────────────────────────────────
 * A thin horizontal bar showing how far through the deck the user is.
 *
 * Pure display component — receives a 0-100 percentage and renders it.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../colors";

interface Props {
  /** How full the bar should be, from 0 to 100 */
  percent: number;
}

const ProgressBar: React.FC<Props> = ({ percent }) => (
  <View style={styles.track}>
    <View style={[styles.fill, { width: `${percent}%` }]} />
  </View>
);

export default ProgressBar;

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 4,
    backgroundColor: COLORS.trackBg,
    overflow: "hidden",
    marginBottom: 28,
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});