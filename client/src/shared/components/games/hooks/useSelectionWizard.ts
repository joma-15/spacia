import { useCallback, useEffect, useRef, useState } from "react";
import { getFolders } from "@/shared/database/folderRepository";
import { getCardCountsPerFolder } from "@/shared/database/flashcardRepository";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loadFolders as loadFolderResource } from "@/shared/services/folderDataService";

export interface Folder {
  id: string;
  subject: string;
  accentColor: string;
  cardCount: number;
}

export function useSelectionWizard() {
  const { cacheOwnerId } = useAuth();
  const userId = cacheOwnerId;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  // Helper to compare two folder lists to avoid unnecessary state updates
  const areFolderListsEqual = (listA: Folder[], listB: Folder[]): boolean => {
    if (listA.length !== listB.length) return false;
    for (let i = 0; i < listA.length; i++) {
      const a = listA[i];
      const b = listB[i];
      if (
        a.id !== b.id ||
        a.subject !== b.subject ||
        a.accentColor !== b.accentColor ||
        a.cardCount !== b.cardCount
      ) {
        return false;
      }
    }
    return true;
  };

  // Loads folders from the local SQLite database cache
  const loadCachedFolders = useCallback(() => {
    try {
      if (!userId) {
        setFolders([]);
        return [];
      }
      const cached = getFolders(userId);
      const cardCounts = getCardCountsPerFolder(userId);

      const parsed: Folder[] = cached.map((folder: any) => ({
        id: folder.id,
        subject: folder.subject,
        accentColor: folder.accent_color || folder.accentColor,
        cardCount: cardCounts[folder.id] ?? 0,
      }));

      setFolders((prev) => {
        if (areFolderListsEqual(prev, parsed)) {
          return prev;
        }
        return parsed;
      });

      return parsed;
    } catch (error) {
      console.error("Failed to load cached folders:", error);
      return [];
    }
  }, [userId]);

  // Fetches folders from the backend and updates the cache
  const fetchFolders = useCallback(async (isARefresh = false) => {
    if (!isMountedRef.current) return;

    if (isARefresh) {
      setRefreshing(true);
    } else {
      // Only show main spinner if there are no folders cached yet
      const currentCache = loadCachedFolders();
      if (currentCache.length === 0) {
        setLoading(true);
      }
    }

    try {
      if (!userId) {
        setFolders([]);
        return;
      }
      await loadFolderResource(userId, isARefresh ? "network-only" : "stale-while-revalidate");

      if (!isMountedRef.current) return;
      loadCachedFolders();
    } catch (error) {
      // console.error("fetchFolders failed, using offline cache:", error);
      // Fallback to offline cache
      loadCachedFolders();
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [loadCachedFolders, userId]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial sync
    fetchFolders();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFolders]);

  return {
    loading,
    refreshing,
    folders,
    fetchFolders,
  };
}
