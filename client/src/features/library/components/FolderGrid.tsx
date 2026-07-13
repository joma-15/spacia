/**
 * FolderGrid.tsx
 * ─────────────────────────────────────────────
 * Renders the 2-column grid of FolderCard components.
 *
 * WHY a separate file?
 * The grid layout logic (flexWrap, gap) is kept here so LibraryScreen
 * doesn't have to think about it, and FolderCard doesn't have to
 * know it lives inside a grid.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import FolderCard from "./FolderCard";
import type { Folder } from "../types";

interface Props {
  folders: Folder[];
  onDelete: (id: string) => void;
  onRename: (id: string, newSubject: string) => void;
}

const FolderGrid: React.FC<Props> = ({ folders, onDelete, onRename }) => (
  <View style={styles.grid}>
    {folders.map((folder) => (
      <FolderCard
        key={folder.id}
        folder={folder}
        onDelete={onDelete}
        onRename={onRename}
        onPress={() =>
          // Navigate to the cards screen for this folder,
          // passing the folder id and name as URL params
          router.push({
            pathname: "/CardScreen",
            params: { folderId: folder.id, folderName: folder.subject },
          })
        }
      />
    ))}
  </View>
);

export default FolderGrid;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",  // cards wrap to next line when row is full
    gap: 14,
    marginBottom: 22,
  },
});