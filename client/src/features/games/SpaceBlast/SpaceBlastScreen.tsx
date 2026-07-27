import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import SpaceBackground from "./SpaceBackground";
import { useFlashcardSync } from "./hooks/useFlashcardSync";
import { THEME } from "./colors";

/**
 * Wires a single study folder's flashcards into the game.
 * Loading/syncing is handled by `useFlashcardSync`; this component just
 * connects that data to `SpaceBackground` (the actual game).
 */
const SpaceBlastGameContent: React.FC<{ folderId: string; folderName: string }> = ({ folderId, folderName }) => {
  const { cards, isDataLoading, handleAnswer } = useFlashcardSync(folderId);

  return (
    <SpaceBackground
      flashcards={cards}
      isDataLoading={isDataLoading}
      studySets={[{ id: folderId, name: folderName }]}
      currentStudySetId={folderId}
      onAnswer={(cardId, correct) => handleAnswer(cardId, correct)}
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
