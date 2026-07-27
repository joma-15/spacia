import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { StarConfig } from "../types";

/**
 * One tiny background star that slowly fades in and out (twinkles),
 * forever, on a loop. Purely decorative.
 */
const Star: React.FC<{ config: StarConfig }> = React.memo(({ config }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: config.maxOpacity,
          duration: config.duration,
          delay: config.delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: config.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.star,
        {
          left: config.x,
          top: config.y,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          opacity,
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
});

export default Star;
