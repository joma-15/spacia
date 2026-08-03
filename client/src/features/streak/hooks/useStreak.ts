// ============================================================================
// Spacia — useStreak
// Loads streak info via StreakService. The UI never knows whether this data
// comes from mock services or a real backend.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { StreakService } from "../services/StreakService";
import { AsyncResource, StreakInfo } from "../types";

export function useStreak(): AsyncResource<StreakInfo> {
  const [data, setData] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await StreakService.getStreak();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load streak.");
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
