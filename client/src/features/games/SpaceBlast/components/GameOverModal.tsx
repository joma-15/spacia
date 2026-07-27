import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { THEME } from "../colors";
import CornerFrame from "./CornerFrame";
import { modalStyles } from "./modalStyles";

/**
 * Shown when the player has lost every life.
 */
const GameOverModal: React.FC<{ onOk: () => void }> = ({ onOk }) => (
  <View style={modalStyles.overlay} pointerEvents="auto">
    <View style={[modalStyles.card, styles.card]}>
      <CornerFrame danger />

      <View style={[modalStyles.badge, styles.badge]}>
        <Text style={styles.icon}>♥</Text>
      </View>
      <Text style={[modalStyles.title, styles.title]}>GAME OVER</Text>
      <Text style={modalStyles.subtitle}>You ran out of lives. Give it another shot!</Text>

      <Pressable onPress={onOk} style={({ pressed }) => [modalStyles.button, styles.button, pressed && modalStyles.pressed]}>
        <Text style={modalStyles.buttonText}>OK</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { borderColor: THEME.wrongGlow, shadowColor: THEME.wrong },
  badge: { backgroundColor: THEME.wrongGlow, borderColor: THEME.wrong },
  icon: { fontSize: 20, color: THEME.wrong },
  title: { color: THEME.wrong },
  button: { backgroundColor: THEME.wrong },
});

export default GameOverModal;
