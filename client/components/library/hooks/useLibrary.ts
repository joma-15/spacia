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
import {
  saveFolders,
  getFolders,
  deleteFolder as deleteFolderCache,
} from "../../../src/database/folderRepository";

export function useLibrary() {
  // ── State ────────────────────────────────────────────────────────────────

  /** The master list of all subject folders */
  const [folders, setFolders] = useState<Folder[]>([]);

  /** Whether the "flash on unlock" notification feature is turned on */
  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);

  /** What the user has typed in the search bar */
  const [searchQuery, setSearchQuery] = useState<string>("");

  //loading for modals
  const [loading, setLoading] = useState<boolean>(true);

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
  //load cache folders
  const loadCachedFolders = () => {
    try {
      const cachedFolders = getFolders();

      const parsedFolders: Folder[] = cachedFolders.map((folder: any) => ({
        cardCount: 0,
        id: folder.id,
        subject: folder.subject,
        accentColor: folder.accent_color,
      }));

      setFolders(parsedFolders);

      console.log("Loaded folders from SQLite");
    } catch (error) {
      console.error("SQLite load error:", error);
    }
  };
  //for fetching current folder data to database
  const fetchFolder = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://192.168.8.40:5000/folders");

      if (!response.ok) {
        throw new Error("failed to fetch folders");
      }

      const foldersFromDB = await response.json();

      setFolders(foldersFromDB.response);

      saveFolders(foldersFromDB.response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // everytime the screen first open and load
  useEffect(() => {
    loadCachedFolders();
    fetchFolder();
  }, []);

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

  const deleteFolder = async (id: string) => {
    try {
      await fetch(`http://192.168.8.40:5000/folders/${id}`, {
        method: "DELETE",
      });

      deleteFolderCache(id);

      setFolders((prev) => prev.filter((folder) => folder.id !== id));
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
    loading,
    // actions
    setPopupEnabled,
    setSearchQuery,
    clearSearch,
    addFolder,
    deleteFolder,
  };
}
