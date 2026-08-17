// ============================================================================
// Spacia — useStatistics
// ============================================================================

import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StatisticsService } from "../services/StatisticsService";
import { AsyncResource, Statistics } from "../types";

export function useStatistics(): AsyncResource<Statistics> {
  const [data, setData] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await StatisticsService.getStatistics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics.");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  // Refresh whenever the dashboard becomes visible so sessions completed in a
  // game screen are reflected without maintaining a duplicate global store.
  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
