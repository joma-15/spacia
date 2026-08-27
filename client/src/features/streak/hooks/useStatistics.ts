import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { DashboardService } from "../services/DashboardService";
import { AsyncResource, Statistics } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { subscribeResource } from "@/shared/services/resourceStore";

export function useStatistics(): AsyncResource<Statistics> {
  const { cacheOwnerId, isRestoring } = useAuth();
  const [data, setData] = useState<Statistics | null>(() => {
    if (!cacheOwnerId) return null;
    return DashboardService.getCachedDashboard(cacheOwnerId)?.statistics ?? null;
  });
  const [loading, setLoading] = useState(!data);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRestoring || !cacheOwnerId) return;
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      const dashboard = await DashboardService.getDashboard(
        cacheOwnerId,
        isRefresh ? "network-only" : "stale-while-revalidate",
      );
      setData(dashboard.statistics);
    } catch (err) {
      console.warn("Failed to refresh statistics, keeping cached data:", err);
      const cached = DashboardService.getCachedDashboard(cacheOwnerId);
      if (cached) setData(cached.statistics);
      else setError(err instanceof Error ? err.message : "Failed to load statistics.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [cacheOwnerId, isRestoring]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  useEffect(() => {
    if (!cacheOwnerId) return;
    return subscribeResource(cacheOwnerId, "streak-dashboard", () => {
      const cached = DashboardService.getCachedDashboard(cacheOwnerId);
      if (cached) setData(cached.statistics);
    });
  }, [cacheOwnerId]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
