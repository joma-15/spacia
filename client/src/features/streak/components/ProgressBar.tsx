import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "../constants/theme";

interface ProgressBarProps {
  /** 0–100 */
  percent: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

export function ProgressBar({
  percent,
  height = 8,
  trackColor = colors.surfaceHighlight,
  fillColor = colors.primary,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
