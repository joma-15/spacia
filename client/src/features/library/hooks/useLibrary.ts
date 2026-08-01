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

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { Folder } from "../types";
import {
  saveFolders,
  getFolders,
  deleteFolder as deleteFolderCache,
  updateFolder as updateFolderCache,
  getFoldersBySyncStatus,
} from "@/shared/database/folderRepository";
import { getCardCountsPerFolder } from "@/shared/database/flashcardRepository";
import { BASE_URL } from "@/shared/config/api";
import { uuidv4 } from "@/shared/database/database";
import { getAccessToken } from "@/shared/components/auth/session";

export function useLibrary() {
  const isMountedRef = useRef(false);
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
  const loadCachedFolders = useCallback(() => {
    try {
      const cachedFolders = getFolders();

      // Single GROUP BY query — gets all folder card counts in one shot (offline-safe)
      const cardCounts = getCardCountsPerFolder();

      const parsedFolders: Folder[] = cachedFolders.map((folder: any) => ({
        id: folder.id,
        subject: folder.subject,
        accentColor: folder.accent_color,
        cardCount: cardCounts[folder.id] ?? 0,
      }));

      if (isMountedRef.current) setFolders(parsedFolders);
    } catch (error) {
      console.error("SQLite load error:", error);
    }
  }, []);

  // background sync helper
  const syncPendingFolders = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // 1. Process pending creations
      const pendingCreates = getFoldersBySyncStatus("pending_create") as any[];
      for (const folder of pendingCreates) {
        const response = await fetch(`${BASE_URL}/folders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: folder.id,
            subject: folder.subject,
            accentColor: folder.accent_color || folder.accentColor,
          }),
        });
        if (response.ok) {
          saveFolders(
            [
              {
                id: folder.id,
                subject: folder.subject,
                accentColor: folder.accent_color || folder.accentColor,
              },
            ],
            "synced"
          );
        }
      }

      // 2. Process pending deletions
      const pendingDeletes = getFoldersBySyncStatus("pending_delete") as any[];
      for (const folder of pendingDeletes) {
        const response = await fetch(`${BASE_URL}/folders/${folder.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          deleteFolderCache(folder.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync folders with server:", error);
    }
  }, []);

  //for fetching current folder data to database
  const fetchFolder = useCallback(async () => {
    try {
      if (isMountedRef.current) setLoading(true);

      const token = await getAccessToken();
      if (!token) {
        loadCachedFolders();
        return;
      }

      const response = await fetch(`${BASE_URL}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("failed to fetch folders");
      }

      const foldersFromDB = await response.json();

      if (!isMountedRef.current) return;

      // Save server folders to cache
      saveFolders(foldersFromDB.response, "synced");

      // Run background sync for pending actions
      void syncPendingFolders();

      // Read final list from SQLite (which merges fetched server folders + any pending folder creations)
      loadCachedFolders();
    } catch (error) {
      console.error("fetchFolder failed, using cached:", error);
      loadCachedFolders();
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [loadCachedFolders, syncPendingFolders]);

  // ── Mount: set up ref and kick off server fetch ──────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    void fetchFolder();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFolder]);

  // ── Focus: re-read SQLite counts every time the screen is entered ─────────
  // This fires on initial mount AND every time the user navigates back here
  // (e.g. returning from a folder after adding/deleting cards).
  // SQLite is always up-to-date because cards are written there immediately,
  // so this is instant and works fully offline.
  useFocusEffect(
    useCallback(() => {
      loadCachedFolders();
    }, [loadCachedFolders])
  );

  const addFolder = async (
    subject: string,
    accentColor: string,
  ): Promise<void> => {
    const newId = uuidv4();
    const newFolder: Folder = {
      id: newId,
      subject: subject.trim(),
      accentColor,
      cardCount: 0,
    };

    // Eagerly update UI state
    setFolders((prev) => [newFolder, ...prev]);

    // Eagerly save to SQLite cache as pending
    saveFolders([newFolder], "pending_create");

    // Perform background sync (non-blocking)
    void syncPendingFolders();
  };

  const deleteFolder = async (id: string) => {
    // Eagerly update UI state
    setFolders((prev) => prev.filter((folder) => folder.id !== id));

    // Eagerly delete/mark pending deletion in SQLite cache
    deleteFolderCache(id);

    // Perform background sync (non-blocking)
    void syncPendingFolders();
  };

  /** Delete every folder at once */
  const deleteAllFolders = async () => {
    // Eagerly clear UI
    const ids = folders.map((f) => f.id);
    setFolders([]);
    // Mark each as deleted in SQLite
    ids.forEach((id) => deleteFolderCache(id));
    // Background sync
    void syncPendingFolders();
  };

  /** Rename a folder subject */
  const renameFolder = (id: string, newSubject: string) => {
    // Eagerly update UI
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, subject: newSubject } : f))
    );
    // Update in SQLite
    updateFolderCache(id, newSubject);
    // Background sync
    void syncPendingFolders();
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
    deleteAllFolders,
    renameFolder,
  };
}
