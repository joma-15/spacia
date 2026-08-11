/**
 * FlipSortScreen.tsx
 * ─────────────────────────────────────────────
 * Orchestrates the Flip & Sort game screen: loading cards from SQLite,
 * keying the game content to folderId so it resets state on folder changes,
 * and rendering components like custom header, progress bar, 3D card, and actions.
 */

import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "./colors";
import {
  getFlashcardsByFolder,
  updateFlashcardStatus,
} from "@/shared/database/flashcardRepository";
import type { Flashcard } from "./types";
import { useCardFlip } from "./hooks/useCardFlip";
import { useFlipSortSession } from "./hooks/useFlipSortSession";
import FlipSortHeader from "./components/FlipSortHeader";
import ProgressBar from "./components/ProgressBar";
import FlipCard from "./components/FlipCard";
import ActionButtons from "./components/ActionButtons";
import { BASE_URL } from "@/shared/config/api";
import { getAccessToken } from "@/shared/components/auth/session";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  startStudySession,
  endStudySession,
} from "@/shared/services/StudySessionsService";

interface GameContentProps {
  folderId: string;
  folderName: string;
}

const FlipSortGameContent: React.FC<GameContentProps> = ({
  folderId,
  folderName,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cacheOwnerId } = useAuth();
  const userId = cacheOwnerId;

  // Load cards for this folder from database as state
  const [cards, setCards] = useState<Flashcard[]>([]);

  //study session
  useEffect(() => {
    let sessionStarted = false;

    const startSession = async () => {
      try {
        await startStudySession();
        sessionStarted = true;
      } catch (error) {
        console.error("Failed to start study session:", error);
      }
    };

    startSession();

    return () => {
      if (sessionStarted) {
        endStudySession().catch((error) => {
          console.error("Failed to end study session:", error);
        });
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (!userId) {
        setCards([]);
        return;
      }
      const dbCards = getFlashcardsByFolder(userId, folderId) as any[];
      const mapped = dbCards
        .map((c) => ({
          id: String(c.id),
          question: c.question,
          answer: c.answer,
          status: c.status,
        }))
        .filter((card) => card.status === "review");

      setCards(mapped);
    } catch (e) {
      console.error("Failed to load cards for Flip & Sort:", e);
      setCards([]);
    }
  }, [folderId, userId]);

  // Callback to update status immediately in SQLite and state
  // const onUpdateCardStatus = useCallback((cardId: string, newStatus: 'review' | 'understood') => {
  //   try {
  //     updateFlashcardStatus(cardId, newStatus);
  //     setCards((prev) =>
  //       prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
  //     );
  //   } catch (e) {
  //     console.error("Failed to update flashcard status:", e);
  //   }
  // }, []);

  const onUpdateCardStatus = useCallback(
    async (cardId: string, newStatus: "review" | "understood") => {
      try {
        // Update local SQLite
        if (!userId) return;
        updateFlashcardStatus(userId, cardId, newStatus);

        // Update React state
        setCards((prev) =>
          prev.map((card) =>
            card.id === cardId ? { ...card, status: newStatus } : card,
          ),
        );

        // Sync to backend
        const token = await getAccessToken();
        if (!token) return;
        const response = await fetch(`${BASE_URL}/flashcards/${cardId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update flashcard");
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to update flashcard status:", error);
      }
    },
    [userId],
  );

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
  const handleBackPress = () => {
    router.replace("/(tabs)/game");
  };

  const handleChangeFolderPress = useCallback(() => {
    // Navigate back to selection wizard to choose another folder
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/FlipSort" },
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
    reviewCount,
    understoodCount,
  } = useFlipSortSession({
    cards,
    onUpdateCardStatus,
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

      {/* Quizlet-style count indicators */}
      <View style={styles.counterRow}>
        <View style={[styles.counterPill, styles.reviewCounterPill]}>
          <Text style={styles.reviewCounterText}>{reviewCount}</Text>
        </View>
        <View style={[styles.counterPill, styles.understoodCounterPill]}>
          <Text style={styles.understoodCounterText}>{understoodCount}</Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {currentCard ? (
          <FlipCard
            card={currentCard}
            showBack={showBack}
            frontInterpolate={frontInterpolate}
            backInterpolate={backInterpolate}
            onFlip={flipCard}
            onSwipe={(direction) => {
              if (direction === "left") {
                markForReview(true);
              } else if (direction === "right") {
                markAsUnderstood(true);
              } else if (direction === "up") {
                skipCard();
              }
            }}
            isFirstCard={index === 0}
          />
        ) : null}
      </View>

      <ActionButtons
        isFlipped={isFlipped}
        onReviewPress={() => markForReview(isFlipped)}
        onUnderstoodPress={() => markAsUnderstood(isFlipped)}
        bottomInset={insets.bottom}
        status={currentCard?.status}
      />
    </View>
  );
};

const FlipSortScreen: React.FC = () => {
  const { folderId, folderName } = useLocalSearchParams<{
    folderId: string;
    folderName: string;
  }>();

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
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 6,
    width: "100%",
  },
  counterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 46,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewCounterPill: {
    backgroundColor: "rgba(58, 42, 20, 0.4)",
    borderColor: COLORS.reviewBorder,
  },
  reviewCounterText: {
    color: COLORS.reviewText,
    fontWeight: "800",
    fontSize: 14,
  },
  understoodCounterPill: {
    backgroundColor: "rgba(31, 122, 75, 0.4)",
    borderColor: COLORS.understoodBorder,
  },
  understoodCounterText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
  },
});
