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
import { uuidv4 } from "@/shared/database/database";
import { ApiRequestError, authenticatedFetch } from "@/shared/services/authenticatedFetch";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Stable key used to store/read folders for a user who hasn't logged in yet.
// Everything is scoped under this id until they sign in.
const GUEST_ID = "guest_local";

export function useLibrary() {
  const { cacheOwnerId } = useAuth();
  const isGuest = !cacheOwnerId;
  const userId = cacheOwnerId ?? GUEST_ID; // always have something to key cache with
  const isMountedRef = useRef(false);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const filteredFolders = folders.filter((folder) =>
    folder.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Folder actions ────────────────────────────────────────────────────────

  const loadCachedFolders = useCallback(() => {
    try {
      const cachedFolders = getFolders(userId);
      const cardCounts = getCardCountsPerFolder(userId);

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
  }, [userId]);

  const syncPendingFolders = useCallback(async () => {
    // Guests have no account to sync to — everything just lives locally.
    if (isGuest) return;

    try {
      const pendingCreates = getFoldersBySyncStatus(userId, "pending_create") as any[];
      for (const folder of pendingCreates) {
        const response = await authenticatedFetch("/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: folder.id,
            subject: folder.subject,
            accentColor: folder.accent_color || folder.accentColor,
          }),
        });
        if (response.ok) {
          saveFolders(
            userId,
            [{ id: folder.id, subject: folder.subject, accentColor: folder.accent_color || folder.accentColor }],
            "synced",
          );
        }
      }

      const pendingDeletes = getFoldersBySyncStatus(userId, "pending_delete") as any[];
      for (const folder of pendingDeletes) {
        const response = await authenticatedFetch(`/folders/${folder.id}`, { method: "DELETE" });
        if (response.ok) {
          deleteFolderCache(userId, folder.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync folders with server:", error);
    }
  }, [userId, isGuest]);

  const fetchFolder = useCallback(async () => {
    try {
      if (isMountedRef.current) setLoading(true);

      // Guests can't hit the server — just read whatever's cached locally.
      if (isGuest) {
        loadCachedFolders();
        return;
      }

      const response = await authenticatedFetch("/folders");
      const foldersFromDB = await response.json();

      if (!isMountedRef.current) return;

      saveFolders(userId, foldersFromDB.response, "synced");
      void syncPendingFolders();
      loadCachedFolders();
    } catch (error) {
      // if (error instanceof ApiRequestError) {
      //   console.error("Folder request failed; using cached folders:", {
      //     status: error.status,
      //     code: error.code,
      //   });
      // } else {
      //   console.error("Folder request failed; using cached folders:", error);
      // }
      // Fallback for logged-in users whose request failed (offline, timeout, etc.)
      loadCachedFolders();
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [isGuest, loadCachedFolders, syncPendingFolders, userId]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchFolder();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFolder]);

  useFocusEffect(
    useCallback(() => {
      loadCachedFolders();
    }, [loadCachedFolders]),
  );

  const addFolder = async (subject: string, accentColor: string): Promise<void> => {
    const newId = uuidv4();
    const newFolder: Folder = { id: newId, subject: subject.trim(), accentColor, cardCount: 0 };

    setFolders((prev) => [newFolder, ...prev]);
    saveFolders(userId, [newFolder], "pending_create");
    void syncPendingFolders();
  };

  const deleteFolder = async (id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    deleteFolderCache(userId, id);
    void syncPendingFolders();
  };

  const deleteAllFolders = async () => {
    const ids = folders.map((f) => f.id);
    setFolders([]);
    ids.forEach((id) => deleteFolderCache(userId, id));
    void syncPendingFolders();
  };

  const renameFolder = (id: string, newSubject: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, subject: newSubject } : f)));
    updateFolderCache(userId, id, newSubject);
    void syncPendingFolders();
  };

  const clearSearch = (): void => setSearchQuery("");

  return {
    folders,
    popupEnabled,
    searchQuery,
    filteredFolders,
    loading,
    setPopupEnabled,
    setSearchQuery,
    clearSearch,
    addFolder,
    deleteFolder,
    deleteAllFolders,
    renameFolder,
  };
}