import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { THEME } from "../colors";
import { QUESTION_CARD_HEIGHT } from "../constants";
import CornerFrame from "./CornerFrame";

/**
 * The green panel near the bottom of the screen that shows the current
 * question and how far through the deck the player is.
 *
 * TEXT READABILITY IMPROVEMENTS
 * ─────────────────────────────
 * • Font size shrinks as the question text gets longer so medium-length
 *   questions still look prominent while fitting inside the card.
 * • For very long questions the text block becomes scrollable instead of
 *   being clipped by numberOfLines.
 * • The card's height adjusts upward for medium-length questions to give
 *   the text more breathing room without changing the game layout.
 */

/**
 * Returns a font size that shrinks as text gets longer.
 *
 * Short  (≤ 60 chars)  → 15 px
 * Medium (≤ 120 chars) → 13 px
 * Long   (> 120 chars) → 11 px — plus ScrollView kicks in
 */
function getQuestionFontSize(text: string): number {
  const len = text?.length ?? 0;
  if (len <= 60) return 15;
  if (len <= 120) return 13;
  return 11;
}

/**
 * Returns a card height that grows slightly for longer questions so the
 * text has more visible space before scrolling becomes necessary.
 */
function getCardHeight(text: string): number {
  const len = text?.length ?? 0;
  if (len <= 60) return QUESTION_CARD_HEIGHT;
  if (len <= 120) return QUESTION_CARD_HEIGHT + 20;
  // For very long text the height is capped — the ScrollView handles the rest.
  return QUESTION_CARD_HEIGHT + 36;
}

const QuestionCard: React.FC<{
  bottom: number;
  questionText: string;
  currentNumber: number;
  totalCount: number;
}> = ({ bottom, questionText, currentNumber, totalCount }) => {
  const fontSize = getQuestionFontSize(questionText);
  const cardHeight = getCardHeight(questionText);
  const scrollEnabled = (questionText?.length ?? 0) > 120;

  return (
    <View style={[styles.questionCard, { bottom, height: cardHeight }]} pointerEvents="box-none">
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
          {/* ScrollView lets the user read long questions without truncation */}
          <ScrollView
            style={styles.textScrollArea}
            contentContainerStyle={styles.textScrollContent}
            showsVerticalScrollIndicator={scrollEnabled}
            scrollEnabled={scrollEnabled}
            // Prevent scroll from bubbling up to the game's touch handlers
            onStartShouldSetResponder={() => scrollEnabled}
          >
            <Text style={[styles.questionText, { fontSize, lineHeight: fontSize * 1.45 }]}>
              {questionText}
            </Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

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
    alignItems: "flex-start",
    flex: 1,
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
    // Keep the badge aligned to the top when text wraps to multiple lines
    marginTop: 2,
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
  // The scroll area fills all remaining vertical space in the text block
  // so the ScrollView has a defined height to scroll within.
  textScrollArea: {
    flex: 1,
  },
  textScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  questionText: {
    color: THEME.textWhite,
    fontWeight: "600",
    // fontSize and lineHeight applied inline (dynamic per question)
  },
});

export default QuestionCard;
