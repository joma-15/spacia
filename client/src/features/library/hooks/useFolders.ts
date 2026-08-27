import { useCallback, useEffect, useState } from "react";
import type { Folder } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getCachedFolders, loadFolders } from "@/shared/services/folderDataService";
import { subscribeResource } from "@/shared/services/resourceStore";

export function useFolders() {
  const { cacheOwnerId } = useAuth();
  const userId = cacheOwnerId ?? "guest_local";

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const cached = getCachedFolders(userId);
      return cached.length > 0 ? cached : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(() => folders.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      const result = await loadFolders(userId, "stale-while-revalidate");
      setFolders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    return subscribeResource(userId, "folders", () => {
      setFolders(getCachedFolders(userId));
    });
  }, [userId]);

  return { folders, loading, error };
}
