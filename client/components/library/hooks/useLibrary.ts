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

import { useState } from "react";
import type { Folder } from "../types";
import { THEME } from "../theme";

export function useLibrary() {

  // ── State ────────────────────────────────────────────────────────────────

  /** The master list of all subject folders */
  const [folders, setFolders] = useState<Folder[]>([]);

  /** Whether the "flash on unlock" notification feature is turned on */
  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);

  /** What the user has typed in the search bar */
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ── Derived data (computed from state, not stored separately) ─────────────

  /**
   * Folders that match the current search query.
   * We compute this every render instead of storing it in state —
   * that way it's always in sync with both `folders` and `searchQuery`.
   */
  const filteredFolders = folders.filter((folder) =>
    folder.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Folder actions ────────────────────────────────────────────────────────

  /**
   * Create a brand-new folder and add it to the top of the list.
   * Called when the user taps "Create Folder" in the modal.
   */
  const addFolder = (subject: string, accentColor: string): void => {
    const newFolder: Folder = {
      id: Date.now().toString(), // simple unique ID using current timestamp
      subject,
      cardCount: 0,              // new folders start empty
      accentColor,
    };
    setFolders((previousFolders) => [newFolder, ...previousFolders]);
  };

  /**
   * Remove a folder permanently by its id.
   * Called after the user confirms the delete alert on a FolderCard.
   */
  const deleteFolder = (id: string): void => {
    setFolders((previousFolders) =>
      previousFolders.filter((folder) => folder.id !== id)
    );
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