import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { THEME } from "../colors";
import CornerFrame from "./CornerFrame";
import { modalStyles } from "./modalStyles";

/**
 * Shown instead of the game when the chosen folder doesn't have enough
 * flashcards yet. Lets the player jump to their library or just close.
 */
const MinCardsModal: React.FC<{
  minFlashcards: number;
  currentCount: number;
  onGoToLibrary: () => void;
  onClose: () => void;
}> = ({ minFlashcards, currentCount, onGoToLibrary, onClose }) => (
  <View style={modalStyles.overlay} pointerEvents="auto">
    <View style={modalStyles.card}>
      <CornerFrame />

      <View style={styles.iconWrap}>
        <View style={styles.iconCardBack} />
        <View style={styles.iconCardFront} />
      </View>

      <Text style={modalStyles.title}>MORE CARDS NEEDED</Text>
      <Text style={modalStyles.subtitle}>
        You need at least {minFlashcards} flashcards to play this game. More
        flashcards are required so the game has enough answer choices.
        {"\n\n"}
        You currently have {currentCount}.
      </Text>

      <Pressable onPress={onGoToLibrary} style={({ pressed }) => [modalStyles.button, pressed && modalStyles.pressed]}>
        <Text style={modalStyles.buttonText}>Go to Library</Text>
      </Pressable>

      <Pressable onPress={onClose} style={({ pressed }) => [styles.secondaryButton, pressed && modalStyles.pressed]}>
        <Text style={styles.secondaryButtonText}>Close</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  iconWrap: {
    width: 56,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconCardBack: {
    position: "absolute",
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    transform: [{ rotate: "-8deg" }, { translateX: -4 }],
  },
  iconCardFront: {
    position: "absolute",
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    transform: [{ rotate: "6deg" }, { translateX: 4 }],
  },
  secondaryButton: {
    width: "100%",
    height: 46,
    borderRadius: THEME.radiusFull,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: THEME.textMid,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default MinCardsModal;
