import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "@/shared/config/api";
import { getFolders, saveFolders } from "@/shared/database/folderRepository";
import { getCardCountsPerFolder } from "@/shared/database/flashcardRepository";
import { getAccessToken } from "@/shared/components/auth/session";

export interface Folder {
  id: string;
  subject: string;
  accentColor: string;
  cardCount: number;
}

export function useSelectionWizard() {
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
      const cached = getFolders();
      const cardCounts = getCardCountsPerFolder();

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
  }, []);

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
      const token = await getAccessToken();
      if (!token) {
        loadCachedFolders();
        return;
      }
      const response = await fetch(`${BASE_URL}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        throw new Error("Cannot fetch folders from backend");
      }
      const data = await response.json();

      if (!isMountedRef.current) return;

      // Save server folders to cache
      if (data && Array.isArray(data.response)) {
        saveFolders(data.response, "synced");
      }

      // Reload the updated data from SQLite cache
      loadCachedFolders();
    } catch (error) {
      console.error("fetchFolders failed, using offline cache:", error);
      // Fallback to offline cache
      loadCachedFolders();
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [loadCachedFolders]);

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