/**
 * FlashcardScreen.tsx
 * ─────────────────────────────────────────────
 * Root screen for studying a deck of flashcards one at a time.
 *
 * This file's ONLY job is to:
 *  1. Wire together the two hooks (flip animation + session logic)
 *  2. Handle the exit confirmation alert
 *  3. Assemble the sub-components into the final layout
 *
 * CHANGE THE LOOK         → edit the component files
 * CHANGE THE FLIP LOGIC   → edit useCardFlip.ts
 * CHANGE THE SESSION LOGIC → edit useStudySession.ts
 * CHANGE THE COLORS       → edit colors.ts
 */

import { Alert, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useCardFlip } from "../../components/flashcardStudy/hooks/useCardFlip";
import { useStudySession } from "../../components/flashcardStudy/hooks/useStudySession";

// ── Components ────────────────────────────────────────────────────────────────
import StudyHeader   from "../../components/flashcardStudy/components/StudyHeader";
import ProgressBar   from "../../components/flashcardStudy/components/ProgressBar";
import FlipCard      from "../../components/flashcardStudy/components/FlipCard";
import ActionButtons from "../../components/flashcardStudy/components/ActionButtons";
import EmptyDeckState from "../../components/flashcardStudy/components/EmptyDeckState";

// ── Colors & types ────────────────────────────────────────────────────────────
import { COLORS } from "../../components/flashcardStudy/colors";
import type { FlashcardScreenProps, Flashcard } from "../../components/flashcardStudy/types";

// ── Demo data (replace with your real deck) ───────────────────────────────────
const DEFAULT_CARDS: Flashcard[] = [
  { id: "1", question: "What is Newton's First Law?", answer: "An object stays at rest or in uniform motion unless acted on by a net external force." },
  { id: "2", question: "What is the formula for kinetic energy?", answer: "KE = ½mv²" },
  { id: "3", question: "What is the unit of electric current?", answer: "Ampere (A)" },
];

export default function FlashcardScreen({
  cards = DEFAULT_CARDS,
  onBack,
  onExit,
}: FlashcardScreenProps) {
  const insets = useSafeAreaInsets();

  // ── Flip animation state (front/back, rotation values) ─────────────────────
  const {
    isFlipped,
    showBack,
    frontInterpolate,
    backInterpolate,
    flipCard,
    resetFlip,
  } = useCardFlip();

  // ── Session state (current card, scores, advancing) ─────────────────────────
  const {
    currentCard,
    reviewCount,
    understoodCount,
    progressPercent,
    totalCards,
    markForReview,
    markAsUnderstood,
  } = useStudySession({
    cards,
    onComplete: onBack,
    resetFlip,
  });

  // Note: index for the header display — useStudySession exposes the raw
  // 0-based index via the `index` field if needed elsewhere, but here we
  // just need the 1-based card number, which we get from progressPercent's
  // source data. We pull it directly for clarity:
  const cardNumber = Math.round((progressPercent / 100) * totalCards);

  // ── Exit confirmation ────────────────────────────────────────────────────────

  /** Ask the user to confirm before leaving the session early */
  const handleExitPress = (): void => {
    Alert.alert(
      "Exit deck?",
      "Your progress on this session will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: onExit ?? onBack },
      ]
    );
  };

  // ── Empty deck guard ──────────────────────────────────────────────────────────

  if (!currentCard) {
    return <EmptyDeckState />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <View style={[
      styles.screen,
      {
        paddingTop:    insets.top + 12,
        paddingBottom: insets.bottom,
        paddingLeft:   insets.left + 20,
        paddingRight:  insets.right + 20,
      },
    ]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.screenBg} />

      {/* ── ✕ exit button + "Card X of Y" ── */}
      <StudyHeader
        currentNumber={cardNumber}
        totalCards={totalCards}
        onExitPress={handleExitPress}
      />

      {/* ── Deck completion progress bar ── */}
      <ProgressBar percent={progressPercent} />

      {/* ── The flippable card itself ── */}
      <View style={styles.cardArea}>
        <FlipCard
          card={currentCard}
          showBack={showBack}
          frontInterpolate={frontInterpolate}
          backInterpolate={backInterpolate}
          onFlip={flipCard}
        />
      </View>

      {/* ── Hint shown only before the first flip ── */}
      {!isFlipped && (
        <Text style={styles.hintText}>Tap the card to reveal the answer</Text>
      )}

      {/* ── Review / Understood buttons ── */}
      <ActionButtons
        isFlipped={isFlipped}
        onReviewPress={() => markForReview(isFlipped)}
        onUnderstoodPress={() => markAsUnderstood(isFlipped)}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: COLORS.screenBg },
  cardArea: { flex: 1, justifyContent: "center" },
  hintText: {
    textAlign: "center",
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 10,
  },
});