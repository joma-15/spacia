import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { colors, radii } from "../constants/theme";

interface SkeletonCardProps {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
}

/** A simple pulsing skeleton block, used anywhere data is still loading. */
export function SkeletonCard({
  height = 100,
  width = "100%",
  borderRadius = radii.lg,
  style,
}: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { height, width, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
  },
});
