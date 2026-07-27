import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { THEME } from "../colors";

/**
 * Shows the player's remaining lives as a row of hearts. Filled hearts
 * = lives left, outlined hearts = lives already lost.
 */
const LivesRow: React.FC<{ top: number; lives: number; maxLives: number }> = ({ top, lives, maxLives }) => (
  <View style={[styles.livesRow, { top }]} pointerEvents="none">
    {Array.from({ length: maxLives }, (_, i) => (
      <MaterialCommunityIcons
        key={i}
        name={i >= lives ? "heart-outline" : "heart"}
        size={28}
        color={i >= lives ? THEME.textMuted : THEME.wrong}
        style={styles.heartIcon}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  livesRow: {
    position: "absolute",
    left: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  heartIcon: {
    marginRight: 5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LivesRow;
