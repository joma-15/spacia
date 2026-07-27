import React from "react";
import { Animated, StyleSheet } from "react-native";
import { Bullet as BulletData } from "../types";

/**
 * A single glowing bullet flying from the ship toward wherever the
 * player tapped. Purely visual — the flight animation itself lives in
 * `hooks/useBullets.ts`; this component just renders the current
 * position.
 */
const Bullet: React.FC<{ bullet: BulletData }> = React.memo(({ bullet }) => (
  <Animated.View
    pointerEvents="none"
    style={[styles.bullet, { transform: bullet.anim.getTranslateTransform() }]}
  />
));

const styles = StyleSheet.create({
  bullet: {
    position: "absolute",
    left: -3,
    top: 0,
    width: 6,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#ffe066",
    shadowColor: "#ffe066",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default Bullet;
