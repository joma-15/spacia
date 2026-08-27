import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { Folder } from "../types";
import {
  saveFolders,
  reconcileFoldersFromServer,
  getFolders,
  getAllFolders,
  deleteFolder as deleteFolderCache,
  updateFolder as updateFolderCache,
  getFoldersBySyncStatus,
} from "@/shared/database/folderRepository";
import { getCardCountsPerFolder } from "@/shared/database/flashcardRepository";
import { uuidv4 } from "@/shared/database/database";
import { ApiRequestError, authenticatedFetch } from "@/shared/services/authenticatedFetch";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loadFolders as loadFolderResource, recordFolderMutation, getCachedFolders } from "@/shared/services/folderDataService";
import { subscribeResource } from "@/shared/services/resourceStore";

// Stable key used to store/read folders for a user who hasn't logged in yet.
// Everything is scoped under this id until they sign in.
const GUEST_ID = "guest_local";

export function useLibrary() {
  const { cacheOwnerId } = useAuth();
  const isGuest = !cacheOwnerId;
  const userId = cacheOwnerId ?? GUEST_ID; // always have something to key cache with
  const isMountedRef = useRef(false);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const syncQueuedRef = useRef(false);

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const cached = getCachedFolders(userId);
      return cached.length > 0 ? cached : [];
    } catch {
      return [];
    }
  });
  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(() => folders.length === 0);

  const filteredFolders = folders.filter((folder) =>
    folder.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Folder actions ────────────────────────────────────────────────────────

  const loadCachedFolders = useCallback(() => {
    try {
      const cached = getCachedFolders(userId);
      if (isMountedRef.current) {
        if (cached.length > 0) {
          setFolders(cached);
          setLoading(false);
        } else {
          const fallback = getFolders(userId).map((folder: any) => ({
            id: String(folder.id),
            subject: folder.subject,
            accentColor: folder.accent_color ?? folder.accentColor ?? "#6B7280",
            cardCount: 0,
          }));
          setFolders(fallback);
          if (fallback.length > 0) setLoading(false);
        }
      }
    } catch (error) {
      console.error("SQLite load error:", error);
    }
  }, [userId]);

  const logSyncState = useCallback((remoteFolders: any[] = []) => {
    const localFolders = getAllFolders(userId) as any[];
    const pendingCreates = getFoldersBySyncStatus(userId, "pending_create") as any[];
    const pendingUpdates = getFoldersBySyncStatus(userId, "pending_update") as any[];
    const pendingDeletes = getFoldersBySyncStatus(userId, "pending_delete") as any[];
    const describe = (folder: any) => ({
      id: folder.id,
      name: folder.subject,
      syncStatus: folder.sync_status ?? "server",
      source: folder.sync_status ? "SQLite" : "server",
    });

    console.log("FOLDER SYNC DIAGNOSTICS", {
      localFolders: localFolders.map(describe),
      remoteFolders: remoteFolders.map(describe),
      localFolderIds: localFolders.map((folder) => folder.id),
      remoteFolderIds: remoteFolders.map((folder) => folder.id),
      foldersToCreate: pendingCreates.map(describe),
      foldersToUpdate: pendingUpdates.map(describe),
      foldersToDelete: pendingDeletes.map(describe),
    });
  }, [userId]);

  const syncPendingFolders = useCallback(async () => {
    // Guests have no account to sync to — everything just lives locally.
    if (isGuest) return;

    if (syncInFlightRef.current) {
      syncQueuedRef.current = true;
      return syncInFlightRef.current;
    }

    syncInFlightRef.current = (async () => {
      do {
        syncQueuedRef.current = false;
        logSyncState();

      const pendingCreates = getFoldersBySyncStatus(userId, "pending_create") as any[];
        for (const folder of pendingCreates) {
        try {
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
        } catch (error) {
          console.error("Failed to create pending folder on server:", { id: folder.id, error });
        }
      }

      const pendingUpdates = getFoldersBySyncStatus(userId, "pending_update") as any[];
      for (const folder of pendingUpdates) {
        try {
          await authenticatedFetch(`/folders/${folder.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: folder.subject,
              accentColor: folder.accent_color || folder.accentColor,
            }),
          });
          saveFolders(
            userId,
            [{ id: folder.id, subject: folder.subject, accentColor: folder.accent_color || folder.accentColor }],
            "synced",
          );
        } catch (error) {
          console.error("Failed to update pending folder on server:", { id: folder.id, error });
        }
      }

      const pendingDeletes = getFoldersBySyncStatus(userId, "pending_delete") as any[];
      for (const folder of pendingDeletes) {
        try {
          const response = await authenticatedFetch(`/folders/${folder.id}`, { method: "DELETE" });
          if (response.ok) {
          deleteFolderCache(userId, folder.id);
          }
        } catch (error) {
          if (error instanceof ApiRequestError && error.status === 404) {
            // The pending deletion itself proves the user requested this end state.
            // A 404 therefore confirms convergence, not a failed arbitrary delete.
            console.warn("Pending folder deletion already absent on server; clearing stale cache row.", {
              id: folder.id,
              source: "SQLite pending_delete",
            });
            deleteFolderCache(userId, folder.id);
          } else {
            console.error("Failed to delete pending folder on server:", { id: folder.id, error });
          }
        }
      }
      } while (syncQueuedRef.current);
    })();

    try {
      await syncInFlightRef.current;
    } finally {
      syncInFlightRef.current = null;
    }
  }, [userId, isGuest, logSyncState]);

  const fetchFolder = useCallback(async () => {
    try {
      // 1. Immediately ensure cached folders are loaded
      loadCachedFolders();

      // Guests can't hit the server — just read whatever's cached locally.
      if (isGuest) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      // 2. Fetch fresh data in the background
      const remoteFolders = await loadFolderResource(userId);
      if (!isMountedRef.current) return;
      logSyncState(remoteFolders);
      void syncPendingFolders();
      loadCachedFolders();
    } catch (error) {
      console.warn("Folder sync error, keeping cached data:", error);
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

  useEffect(() => {
    return subscribeResource(userId, "folders", loadCachedFolders);
  }, [userId, loadCachedFolders]);

  const addFolder = async (subject: string, accentColor: string): Promise<void> => {
    const newId = uuidv4();
    const newFolder: Folder = { id: newId, subject: subject.trim(), accentColor, cardCount: 0 };

    setFolders((prev) => [newFolder, ...prev]);
    saveFolders(userId, [newFolder], "pending_create");
    recordFolderMutation(userId);
    void syncPendingFolders();
  };

  const deleteFolder = async (id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    deleteFolderCache(userId, id);
    recordFolderMutation(userId);
    void syncPendingFolders();
  };

  const deleteAllFolders = async () => {
    const ids = folders.map((f) => f.id);
    setFolders([]);
    ids.forEach((id) => deleteFolderCache(userId, id));
    recordFolderMutation(userId);
    void syncPendingFolders();
  };

  const renameFolder = (id: string, newSubject: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, subject: newSubject } : f)));
    updateFolderCache(userId, id, newSubject);
    recordFolderMutation(userId);
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
