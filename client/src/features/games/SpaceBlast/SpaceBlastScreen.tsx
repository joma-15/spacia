import React, { useCallback, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import SpaceBackground from "./SpaceBackground";
import { useFlashcardSync } from "./hooks/useFlashcardSync";
import { THEME } from "./colors";

/**
 * Wires a single study folder's flashcards into the game.
 * Loading/syncing is handled by `useFlashcardSync`; this component just
 * connects that data to `SpaceBackground` (the actual game).
 *
 * SYNC MODEL:
 *  - `handleAnswer` is called on every answer (local-only, no network).
 *  - A Set<string> (`pendingUnderstoodRef`) accumulates the IDs of every
 *    card the player answered correctly, deduplicating automatically.
 *  - When the game ends (win or game over), `flushPendingUpdates` sends
 *    ONE batch request with all accumulated understood card IDs.
 *  - `hasSubmittedRef` ensures the flush can only fire once per game
 *    session, preventing duplicate requests if both onWin and a cleanup
 *    lifecycle fire at the same time.
 */
const SpaceBlastGameContent: React.FC<{ folderId: string; folderName: string }> = ({ folderId, folderName }) => {
  const { cards, isDataLoading, handleAnswer, submitGameResults } = useFlashcardSync(folderId);

  // Accumulates understood card IDs during gameplay. Using a Set means
  // the same card can never be queued more than once (req. 8).
  const pendingUnderstoodRef = useRef<Set<string>>(new Set());

  // Guards against concurrent or duplicate flush attempts (req. 16).
  const hasSubmittedRef = useRef(false);

  /**
   * Records a correct answer into the pending queue. Only correct answers
   * are queued — incorrect answers are ignored (req. 4 & 9).
   */
  const onAnswer = useCallback(
    (cardId: string, correct: boolean) => {
      handleAnswer(cardId, correct);
      if (correct) {
        pendingUnderstoodRef.current.add(cardId); // Set deduplicates automatically
      }
    },
    [handleAnswer],
  );

  /**
   * Sends the pending batch to the backend exactly once.
   * If no cards were understood this session, nothing is sent (req. 18).
   */
  const flushPendingUpdates = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    const ids = Array.from(pendingUnderstoodRef.current);
    pendingUnderstoodRef.current.clear();

    try {
      await submitGameResults(ids);
    } catch (err) {
      console.warn("[SpaceBlast] Failed to sync game results:", err);
      // Game has already ended locally — log and continue rather than
      // blocking navigation or retrying (matches Quizzy's error handling).
    }
  }, [submitGameResults]);

  /** Flush before navigating away on win (req. 6A). */
  const onWin = useCallback(async () => {
    await flushPendingUpdates();
  }, [flushPendingUpdates]);

  /** Flush before navigating away on game over (req. 6A). */
  const onGameOver = useCallback(async () => {
    await flushPendingUpdates();
  }, [flushPendingUpdates]);

  return (
    <SpaceBackground
      flashcards={cards}
      isDataLoading={isDataLoading}
      studySets={[{ id: folderId, name: folderName }]}
      currentStudySetId={folderId}
      onAnswer={onAnswer}
      onWin={onWin}
      onGameOver={onGameOver}
    />
  );
};

/**
 * The screen you actually navigate to. Reads `folderId`/`folderName`
 * from the route, and shows an error state if no folder was selected.
 */
const SpaceBlastScreen: React.FC = () => {
  const { folderId, folderName } = useLocalSearchParams<{ folderId: string; folderName: string }>();

  if (!folderId) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>No folder selected.</Text>
      </View>
    );
  }

  return <SpaceBlastGameContent key={folderId} folderId={folderId} folderName={folderName ?? "Space Blast"} />;
};

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: THEME.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: THEME.textMuted,
    fontSize: 16,
  },
});

export default SpaceBlastScreen;
