// ============================================================================
// Spacia — useStatistics
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StatisticsService } from "../services/StatisticsService";
import { AsyncResource, Statistics } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { subscribeResource } from "@/shared/services/resourceStore";

export function useStatistics(): AsyncResource<Statistics> {
  const { cacheOwnerId, isRestoring } = useAuth();
  const [data, setData] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      if (isRestoring || !cacheOwnerId) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await StatisticsService.getStatistics(cacheOwnerId, isRefresh ? "network-only" : "stale-while-revalidate");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics.");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [cacheOwnerId, isRestoring]);

  // Refresh whenever the dashboard becomes visible so sessions completed in a
  // game screen are reflected without maintaining a duplicate global store.
  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  useEffect(() => {
    if (!cacheOwnerId) return;
    return subscribeResource(cacheOwnerId, "streak-statistics", () => { void load(false); });
  }, [cacheOwnerId, load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
