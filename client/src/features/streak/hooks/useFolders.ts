// ============================================================================
// Spacia — useFolders
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardService } from "../services/DashboardService";
import { FolderService } from "../services/FolderService";
import { AsyncResource, Folder } from "../types";
import { subscribeResource } from "@/shared/services/resourceStore";

export function useFolders(): AsyncResource<Folder[]> {
  const { cacheOwnerId, isAuthenticated, isRestoring } = useAuth();
  const [data, setData] = useState<Folder[] | null>(() => {
    if (!cacheOwnerId) return null;
    const dashboardFolders = DashboardService.getCachedDashboard(cacheOwnerId)?.folders;
    if (dashboardFolders && dashboardFolders.length > 0) return dashboardFolders;
    try {
      const local = FolderService.getLocalFolders(cacheOwnerId);
      return local.length > 0 ? local : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!data);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRestoring || !cacheOwnerId) return;
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      const result = isAuthenticated
        ? await FolderService.getRemoteFolders(cacheOwnerId, isRefresh ? "network-only" : "stale-while-revalidate")
        : FolderService.getLocalFolders(cacheOwnerId);
      setData(result);
    } catch (err) {
      if (isAuthenticated) {
        try {
          setData(FolderService.getLocalFolders(cacheOwnerId));
        } catch (localError) {
          setError(localError instanceof Error ? localError.message : "Failed to load folders.");
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to load folders.");
      }
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [cacheOwnerId, isAuthenticated, isRestoring]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  useEffect(() => {
    if (!cacheOwnerId) return;
    return subscribeResource(cacheOwnerId, "folders", () => { void load(false); });
  }, [cacheOwnerId, load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
