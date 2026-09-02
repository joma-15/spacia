/**
 * FlipSortScreen.tsx
 * ─────────────────────────────────────────────
 * Orchestrates the Flip & Sort game screen: loading cards from SQLite,
 * keying the game content to folderId so it resets state on folder changes,
 * and rendering components like custom header, progress bar, 3D card, and actions.
 *
 * SYNC MODEL:
 *  - `onUpdateCardStatus` does LOCAL writes only (SQLite + React state).
 *    No network request is made per card swipe.
 *  - A `pendingBatchRef` Map<cardId, status> accumulates every status change
 *    during the session. Using a Map means the latest status per card always
 *    wins, naturally handling cards the user flips more than once (e.g.,
 *    understood → back → review).
 *  - `flushPendingUpdates` runs ONE `PATCH /flashcards/batch-status` containing
 *    only the cards that reached "understood". If nothing was understood, no
 *    network request is made. It is guarded by `isFlushingRef` so concurrent
 *    flush calls (e.g., completion + back press at the same time) produce
 *    exactly one request.
 *  - Flush is triggered:
 *      A. When the user finishes the deck (via dismissCompletion → onComplete).
 *      B. When the user taps the back/exit button (handleBackPress).
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
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
import { CompletionProgressModal } from "./components/CompletionProgressModal";
import { BASE_URL } from "@/shared/config/api";
import { getAccessToken } from "@/shared/components/auth/session";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  startStudySession,
  endStudySession,
} from "@/shared/services/StudySessionsService";
import { formatStudyDuration } from "@/shared/services/formatStudyDuration";

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
  const activeStudySessionId = useRef<number | null>(null);
  const endingStudySession = useRef<Promise<void> | null>(null);

  // Accumulates the latest status for every card touched this session.
  // Map deduplicates: if the user re-sorts a card, its entry is simply
  // overwritten with the newest status.
  const pendingBatchRef = useRef<Map<string, "review" | "understood">>(new Map());

  // Guard: prevents concurrent flush calls from sending duplicate requests.
  const isFlushingRef = useRef(false);

  // Load cards for this folder from database as state.
  // FlipSort only shows cards still in "review" — understood cards are
  // already learned and don't need to appear in the game (req. 6).
  const [cards, setCards] = useState<Flashcard[]>([]);

  const finishStudySession = useCallback(async () => {
    if (endingStudySession.current) return endingStudySession.current;
    const sessionId = activeStudySessionId.current;
    if (sessionId === null) return;

    // Clear first so duplicate blur/unmount cleanups cannot end the session twice.
    activeStudySessionId.current = null;
    endingStudySession.current = endStudySession(sessionId)
      .then((result) => {
        console.log("⏱ Formatted duration:", formatStudyDuration(result.duration_seconds));
      })
      .catch((error) => {
        console.error("Failed to end study session:", error);
      })
      .finally(() => {
        endingStudySession.current = null;
      });
    return endingStudySession.current;
  }, []);

  // Expo Router may keep a screen mounted in its navigation stack. Using focus
  // rather than a component-only effect ends the session when this activity is left.
  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      const startSession = async () => {
        try {
          const result = await startStudySession();
          if (!isFocused) {
            await endStudySession(result.session_id);
            return;
          }
          activeStudySessionId.current = result.session_id;
        } catch (error) {
          console.error("Failed to start study session:", error);
        }
      };
      void startSession();

      return () => {
        isFocused = false;
        void finishStudySession();
      };
    }, [finishStudySession]),
  );

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

  /**
   * Local-only status update — writes to SQLite and React state immediately
   * so the UI responds without any network latency. The change is also
   * recorded in `pendingBatchRef` for the eventual end-of-session batch flush.
   */
  const onUpdateCardStatus = useCallback(
    (cardId: string, newStatus: "review" | "understood") => {
      try {
        if (!userId) return;

        // Local SQLite write (offline-first)
        updateFlashcardStatus(userId, cardId, newStatus);

        // Update React state so counters and card indicators reflect the change
        setCards((prev) =>
          prev.map((card) =>
            card.id === cardId ? { ...card, status: newStatus } : card,
          ),
        );

        // Queue for the end-of-session batch. Using Map.set means a card that
        // is re-sorted within the same session simply has its entry updated
        // rather than duplicated (req. 8).
        pendingBatchRef.current.set(cardId, newStatus);
      } catch (error) {
        console.error("Failed to update flashcard status locally:", error);
      }
    },
    [userId],
  );

  /**
   * Sends one batch request for all cards that reached "understood" during
   * this session. If nothing was understood, or the request is already in
   * flight, this is a no-op.
   *
   * Cards that ended up back in "review" are intentionally excluded — we
   * only persist the transition to "understood" (req. 2 & 10).
   */
  const flushPendingUpdates = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;

    try {
      // Collect only understood cards from the queue
      const understoodUpdates: { id: string; status: "understood" }[] = [];
      pendingBatchRef.current.forEach((status, id) => {
        if (status === "understood") {
          understoodUpdates.push({ id, status: "understood" });
        }
      });

      // Clear the queue before the network call so a concurrent flush
      // (e.g., triggered by unmount) sees an empty map.
      pendingBatchRef.current.clear();

      if (understoodUpdates.length === 0) return; // nothing to persist (req. 18)

      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`${BASE_URL}/flashcards/batch-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates: understoodUpdates }),
      });

      if (!response.ok) {
        console.warn("[FlipSort] Failed to sync session results:", response.status);
        // Don't re-queue — the local SQLite state is already correct.
        // A future sync (e.g., on next game load) will reconcile with the server.
      }
    } catch (error) {
      console.error("[FlipSort] Error flushing pending updates:", error);
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  // Hook 1: Visual flip animation state
  const {
    showBack,
    frontInterpolate,
    backInterpolate,
    flipCard,
    resetFlip,
  } = useCardFlip();

  /**
   * Flushes pending updates before navigating away so understood cards
   * are not lost when the user taps the back button (req. 6B & 7).
   */
  const handleBackPress = useCallback(async () => {
    await flushPendingUpdates();
    router.replace("/(tabs)/game");
  }, [flushPendingUpdates, router]);

  const handleChangeFolderPress = useCallback(() => {
    // Navigate back to selection wizard to choose another folder
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/FlipSort" },
    });
  }, [router]);

  /**
   * Called when the user dismisses the completion modal. Flushes the
   * pending batch first, then navigates (req. 6A).
   */
  const handleComplete = useCallback(async () => {
    await flushPendingUpdates();
    router.replace("/(tabs)/game");
  }, [flushPendingUpdates, router]);

  // Hook 2: Game session business logic
  const {
    index,
    currentCard,
    progressPercent,
    markForReview,
    markAsUnderstood,
    skipCard,
    totalCards,
    reviewCount,
    understoodCount,
    completionReviewCount,
    completionUnderstoodCount,
    isComplete,
    dismissCompletion,
  } = useFlipSortSession({
    cards,
    onUpdateCardStatus,
    resetFlip,
    onComplete: handleComplete,
  });

  if (cards.length === 0) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
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
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      {/* ── Header ── */}
      <FlipSortHeader
        currentNumber={index + 1}
        totalCards={totalCards}
        folderName={folderName}
        onBackPress={handleBackPress}
        onChangeFolderPress={handleChangeFolderPress}
      />

      {/* ── Progress bar ── */}
      <ProgressBar percent={progressPercent} />

      {/* ── Session score row ── */}
      <View style={styles.counterRow}>
        {/* Review pill (left) */}
        <View style={[styles.counterPill, styles.reviewCounterPill]}>
          <Text style={styles.counterEmoji}>🔁</Text>
          <View style={styles.counterLabelBlock}>
            <Text style={styles.counterLabel}>REVIEW</Text>
            <Text style={styles.reviewCounterText}>{reviewCount}</Text>
          </View>
        </View>

        {/* Understood pill (right) */}
        <View style={[styles.counterPill, styles.understoodCounterPill]}>
          <View style={[styles.counterLabelBlock, styles.counterLabelRight]}>
            <Text style={styles.counterLabel}>GOT IT</Text>
            <Text style={styles.understoodCounterText}>{understoodCount}</Text>
          </View>
          <Text style={styles.counterEmoji}>✓</Text>
        </View>
      </View>

      {/* ── Swipe hint — above the card, not overlapping anything ── */}
      <View style={styles.swipeHintRow}>
        <Text style={styles.swipeHintText}>{"← Review  |  Understood →"}</Text>
      </View>

      {/* ── Flashcard ── */}
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
                markForReview();
              } else if (direction === "right") {
                markAsUnderstood();
              } else if (direction === "up") {
                skipCard();
              }
            }}
            isFirstCard={index === 0}
          />
        ) : null}
      </View>

      <CompletionProgressModal
        visible={isComplete}
        understoodCount={completionUnderstoodCount}
        reviewCount={completionReviewCount}
        onDone={dismissCompletion}
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
  // ── Card container ─────────────────────────────────────────────────────────
  // flex: 1 means it grows to fill remaining space after the fixed-height
  // header, progress bar, counter row, and swipe hint have taken their share.
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Session score row ──────────────────────────────────────────────────────
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    // Prevent the pill from expanding to fill half the row — let content
    // dictate the width so both pills can sit side-by-side comfortably.
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewCounterPill: {
    backgroundColor: "rgba(58, 42, 20, 0.45)",
    borderColor: COLORS.reviewBorder,
  },
  understoodCounterPill: {
    backgroundColor: "rgba(31, 122, 75, 0.45)",
    borderColor: COLORS.understoodBorder,
  },
  counterEmoji: {
    fontSize: 16,
  },
  counterLabelBlock: {
    alignItems: "flex-start",
  },
  counterLabelRight: {
    alignItems: "flex-end",
  },
  counterLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  reviewCounterText: {
    color: COLORS.reviewText,
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 22,
  },
  understoodCounterText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 22,
  },
  // ── Swipe hint ─────────────────────────────────────────────────────────────
  // Placed in normal flow (not absolute) so it never overlaps anything.
  swipeHintRow: {
    alignItems: "center",
    marginBottom: 6,
  },
  swipeHintText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  // ── Misc ───────────────────────────────────────────────────────────────────
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
