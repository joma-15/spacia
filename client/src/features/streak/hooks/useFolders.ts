// ============================================================================
// Spacia — useFolders
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { FolderService } from "../services/FolderService";
import { AsyncResource, Folder } from "../types";

export function useFolders(): AsyncResource<Folder[]> {
  const [data, setData] = useState<Folder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await FolderService.getFolders();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders.");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
