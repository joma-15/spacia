/**
 * useLibrary.ts
 * ─────────────────────────────────────────────
 * Custom hook — the "brain" of the Library screen.
 *
 * WHAT IS A HOOK?
 * A hook is just a function that starts with "use" and can hold
 * React state (useState) and logic. By moving all state here,
 * the screen component only handles what things LOOK like,
 * while this hook handles what things DO.
 *
 * This makes both files much shorter and easier to test.
 */

import { useState, useEffect } from "react";
import type { Folder } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useLibrary() {
  // ── State ────────────────────────────────────────────────────────────────

  /** The master list of all subject folders */
  const [folders, setFolders] = useState<Folder[]>([]);

  /** Whether the "flash on unlock" notification feature is turned on */
  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);

  /** What the user has typed in the search bar */
  const [searchQuery, setSearchQuery] = useState<string>("");

  //each folder key
  const CACHE_KEY = "folders_cache";

  // ── Derived data (computed from state, not stored separately) ─────────────

  /**
   * Folders that match the current search query.
   * We compute this every render instead of storing it in state —
   * that way it's always in sync with both `folders` and `searchQuery`.
   */
  const filteredFolders = folders.filter((folder) =>
    folder.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Folder actions ────────────────────────────────────────────────────────

  /**
   * Create a brand-new folder and add it to the top of the list.
   * Called when the user taps "Create Folder" in the modal.
   */
  // const addFolder = (subject: string, accentColor: string): void => {
  //   const newFolder: Folder = {
  //     id: Date.now().toString(), // simple unique ID using current timestamp
  //     subject,
  //     cardCount: 0,              // new folders start empty
  //     accentColor,
  //   };
  //   setFolders((previousFolders) => [newFolder, ...previousFolders]);
  // };

  //load cache folders
  const loadCachedFolders = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);

      if (cached) {
        const parsed = JSON.parse(cached);
        setFolders(parsed);
        console.log("Loaded folders from cache");
      }
    } catch (err) {
      console.error("Cache load error:", err);
    }
  };

  //for fetching current folder data to database
  const fetchFolder = async () => {
    const response = await fetch("http://192.168.8.40:5000/folders");

    if (!response.ok) {
      throw new Error("failed to fetch folders");
    }
    const foldersFromDB = await response.json();
    setFolders(foldersFromDB.response);

    // ✅ SAVE TO CACHE
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify(foldersFromDB.response),
    );
  };

  // everytime the screen first open and load
  useEffect(() => {
    loadCachedFolders();
    fetchFolder();
  });

  const addFolder = async (
    subject: string,
    accentColor: string,
  ): Promise<void> => {
    try {
      const response = await fetch("http://192.168.8.40:5000/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          accentColor,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create folder");
      }
      await fetchFolder();
    } catch (error) {
      console.error("Failed to create folder ", error);
    }
  };

  /**
   * Remove a folder permanently by its id.
   * Called after the user confirms the delete alert on a FolderCard.
   */
  // const deleteFolder = (id: string): void => {
  //   setFolders((previousFolders) =>
  //     previousFolders.filter((folder) => folder.id !== id),
  //   );
  // };

  const deleteFolder = async (id: string) => {
    try {
      await fetch(`http://192.168.8.40:5000/folders/${id}`, {
        method: "DELETE",
      });
      //fetch the latest data in the database
      await fetchFolder();
    } catch (error) {
      console.error(error);
    }
  };

  /** Clear the search bar text */
  const clearSearch = (): void => setSearchQuery("");

  // ── Return everything the screen needs ───────────────────────────────────
  return {
    // state
    folders,
    popupEnabled,
    searchQuery,
    // derived
    filteredFolders,
    // actions
    setPopupEnabled,
    setSearchQuery,
    clearSearch,
    addFolder,
    deleteFolder,
  };
}
