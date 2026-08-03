// ============================================================================
// Spacia — useAchievements
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { AchievementService } from "../services/AchievementService";
import { Achievement, AsyncResource } from "../types";

export function useAchievements(): AsyncResource<Achievement[]> {
  const [data, setData] = useState<Achievement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await AchievementService.getAchievements();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load achievements.");
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
