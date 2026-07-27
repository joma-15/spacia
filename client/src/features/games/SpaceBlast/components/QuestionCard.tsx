import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME } from "../colors";
import { QUESTION_CARD_HEIGHT } from "../constants";
import CornerFrame from "./CornerFrame";

/**
 * The green panel near the bottom of the screen that shows the current
 * question and how far through the deck the player is.
 */
const QuestionCard: React.FC<{
  bottom: number;
  questionText: string;
  currentNumber: number;
  totalCount: number;
}> = ({ bottom, questionText, currentNumber, totalCount }) => (
  <View style={[styles.questionCard, { bottom, height: QUESTION_CARD_HEIGHT }]} pointerEvents="box-none">
    <CornerFrame />

    <View style={styles.questionRow}>
      <View style={styles.questionBadge}>
        <View style={styles.questionBadgeDiamond} />
      </View>
      <View style={styles.questionTextBlock}>
        <View style={styles.kickerRow}>
          <View style={styles.kickerDot} />
          <Text style={styles.questionKicker}>
            {totalCount > 1 ? `QUESTION ${currentNumber}/${totalCount}` : "INCOMING TRANSMISSION"}
          </Text>
        </View>
        <Text style={styles.questionText} numberOfLines={2}>
          {questionText}
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  questionCard: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 15,
    backgroundColor: THEME.panelBg,
    borderWidth: 1,
    borderColor: THEME.panelBorder,
    borderRadius: THEME.radiusMd,
    padding: 14,
    justifyContent: "center",
    shadowColor: THEME.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  questionBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  questionBadgeDiamond: {
    width: 10,
    height: 10,
    backgroundColor: THEME.primary,
    transform: [{ rotate: "45deg" }],
  },
  questionTextBlock: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  kickerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME.primary,
    marginRight: 6,
  },
  questionKicker: {
    color: THEME.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  questionText: {
    color: THEME.textWhite,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
});

export default QuestionCard;
