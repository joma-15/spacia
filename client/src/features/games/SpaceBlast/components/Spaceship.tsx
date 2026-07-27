import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { SPACESHIP_IMAGE } from "../constants";

/**
 * The player's ship, parked near the bottom of the screen. Purely
 * decorative positioning is handled by the caller via `x`, `y`, `size`.
 */
const Spaceship: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <View pointerEvents="none" style={[styles.ship, { width: size, height: size, left: x, top: y }]}>
    <Image source={SPACESHIP_IMAGE} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  ship: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 16,
  },
});

export default Spaceship;
