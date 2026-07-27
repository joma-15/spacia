import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet } from "react-native";
import { EXPLOSION_DURATION_MS, EXPLOSION_IMAGE_CORRECT, EXPLOSION_IMAGE_WRONG } from "../constants";
import { Explosion as ExplosionData } from "../types";

/**
 * Plays once at the spot a bubble was destroyed, then tells the parent
 * it's done (via `onDone`) so it can be removed from the screen.
 *
 * It doesn't matter that the bubble it's covering for might already be
 * gone by the time this finishes — this component is fully independent.
 */
const Explosion: React.FC<{
  explosion: ExplosionData;
  onDone: (id: number) => void;
}> = React.memo(({ explosion, onDone }) => {
  const scale = useRef(new Animated.Value(0.35)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.3,
        duration: EXPLOSION_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXPLOSION_DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone(explosion.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.explosion,
        { left: explosion.x, top: explosion.y, width: explosion.size, height: explosion.size, opacity, transform: [{ scale }] },
      ]}
    >
      <Image
        source={explosion.variant === "correct" ? EXPLOSION_IMAGE_CORRECT : EXPLOSION_IMAGE_WRONG}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  explosion: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
});

export default Explosion;
