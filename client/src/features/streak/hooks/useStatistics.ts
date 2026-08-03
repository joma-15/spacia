// ============================================================================
// Spacia — useStatistics
// ============================================================================

import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
