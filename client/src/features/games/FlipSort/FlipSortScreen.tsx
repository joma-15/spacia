/**
 * FlipSortScreen.tsx
 * ─────────────────────────────────────────────
 * Orchestrates the Flip & Sort game screen: loading cards from SQLite,
 * keying the game content to folderId so it resets state on folder changes,
 * and rendering components like custom header, progress bar, 3D card, and actions.
 */

import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "./colors";
import { getFlashcardsByFolder } from "@/shared/database/flashcardRepository";
import { useCardFlip } from "./hooks/useCardFlip";
import { useFlipSortSession } from "./hooks/useFlipSortSession";
import FlipSortHeader from "./components/FlipSortHeader";
import ProgressBar from "./components/ProgressBar";
import FlipCard from "./components/FlipCard";
import ActionButtons from "./components/ActionButtons";

interface GameContentProps {
  folderId: string;
  folderName: string;
}

const FlipSortGameContent: React.FC<GameContentProps> = ({ folderId, folderName }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Load cards for this folder from database
  const cards = useMemo(() => {
    try {
      const dbCards = getFlashcardsByFolder(folderId) as any[];
      return dbCards.map((c) => ({
        id: String(c.id),
        question: c.question,
        answer: c.answer,
      }));
    } catch (e) {
      console.error("Failed to load cards for Flip & Sort:", e);
      return [];
    }
  }, [folderId]);

  // Hook 1: Visual flip animation state
  const {
    isFlipped,
    showBack,
    frontInterpolate,
    backInterpolate,
    flipCard,
    resetFlip,
  } = useCardFlip();

  // const handleBackPress = useCallback(() => {
  //   // Navigate back to selection wizard
  //   router.navigate({
  //     pathname: "/games/SelectionWizard",
  //     params: { gameRoute: "/games/FlipSort" }
  //   });
  // }, [router]);
  const handleBackPress = (() => {
    router.replace("/(tabs)/game");
  });

  const handleChangeFolderPress = useCallback(() => {
    // Navigate back to selection wizard to choose another folder
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/FlipSort" }
    });
  }, [router]);

  // Hook 2: Game session business logic
  const {
    index,
    currentCard,
    progressPercent,
    markForReview,
    markAsUnderstood,
    skipCard,
    goToPreviousCard,
    totalCards,
  } = useFlipSortSession({
    cards,
    resetFlip,
    onComplete: handleBackPress, // Navigate back on complete
  });

  if (cards.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}>
        <FlipSortHeader
          currentNumber={0}
          totalCards={0}
          folderName={folderName}
          onBackPress={handleBackPress}
          onChangeFolderPress={handleChangeFolderPress}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cards in this folder yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}>
      <FlipSortHeader
        currentNumber={index + 1}
        totalCards={totalCards}
        folderName={folderName}
        onBackPress={handleBackPress}
        onChangeFolderPress={handleChangeFolderPress}
      />

      <ProgressBar percent={progressPercent} />

      <View style={styles.cardContainer}>
        {currentCard ? (
          <FlipCard
            card={currentCard}
            showBack={showBack}
            frontInterpolate={frontInterpolate}
            backInterpolate={backInterpolate}
            onFlip={flipCard}
            onSwipe={(direction) =>
              direction === "left" ? goToPreviousCard() : skipCard()
            }
            isFirstCard={index === 0}
          />
        ) : null}
      </View>

      <ActionButtons
        isFlipped={isFlipped}
        onReviewPress={() => markForReview(isFlipped)}
        onUnderstoodPress={() => markAsUnderstood(isFlipped)}
        bottomInset={insets.bottom}
      />
    </View>
  );
};

const FlipSortScreen: React.FC = () => {
  const { folderId, folderName } = useLocalSearchParams<{ folderId: string; folderName: string }>();

  if (!folderId) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>No folder selected.</Text>
      </View>
    );
  }

  return (
    <FlipSortGameContent
      key={folderId}
      folderId={folderId}
      folderName={folderName ?? "Flip & Sort"}
    />
  );
};

export default FlipSortScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    paddingHorizontal: 20,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: "center",
  },
  errorScreen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});