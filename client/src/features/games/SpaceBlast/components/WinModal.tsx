import React from "react";
import { Pressable, Text, View } from "react-native";
import CornerFrame from "./CornerFrame";
import { modalStyles } from "./modalStyles";

/**
 * Shown once the player has answered every flashcard in the deck.
 */
const WinModal: React.FC<{ totalCount: number; onOk: () => void }> = ({ totalCount, onOk }) => (
  <View style={modalStyles.overlay} pointerEvents="auto">
    <View style={modalStyles.card}>
      <CornerFrame />

      <View style={modalStyles.badge}>
        <View style={{ width: 10, height: 10, backgroundColor: "#3DDC84", transform: [{ rotate: "45deg" }] }} />
      </View>
      <Text style={modalStyles.title}>CONGRATULATIONS! 🚀</Text>
      <Text style={modalStyles.subtitle}>
        You completed all the flashcards! {totalCount} {totalCount === 1 ? "question" : "questions"} answered correctly.
      </Text>

      <Pressable onPress={onOk} style={({ pressed }) => [modalStyles.button, pressed && modalStyles.pressed]}>
        <Text style={modalStyles.buttonText}>PLAY AGAIN</Text>
      </Pressable>
    </View>
  </View>
);

export default WinModal;
