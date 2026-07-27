import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { SCREEN_W, SCREEN_H } from "../constants";

/**
 * A single shooting star. On a random-ish timer, it streaks diagonally
 * across a patch of sky, fades out, then waits and does it again.
 * Purely decorative — has nothing to do with gameplay.
 *
 * `slotIndex` just staggers multiple shooting stars so they don't all
 * fire at the exact same moment.
 */
const ShootingStar: React.FC<{ slotIndex: number }> = React.memo(({ slotIndex }) => {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runAnimation = () => {
      if (cancelled) return;

      const startX = Math.random() * SCREEN_W * 0.5;
      const startY = Math.random() * SCREEN_H * 0.4;
      const travel = 250 + Math.random() * 150;

      translateX.setValue(startX);
      translateY.setValue(startY);
      opacity.setValue(0);

      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: startX + travel,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: startY + travel * 0.5,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (cancelled) return;
        const nextDelay = 4000 + Math.random() * 6000 + slotIndex * 1500;
        timeoutId = setTimeout(runAnimation, nextDelay);
      });
    };

    const initialDelay = 1000 + slotIndex * 2000;
    timeoutId = setTimeout(runAnimation, initialDelay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shootingStar,
        { opacity, transform: [{ translateX }, { translateY }, { rotate: "35deg" }] },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  shootingStar: {
    position: "absolute",
    width: 90,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default ShootingStar;
