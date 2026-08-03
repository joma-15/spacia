// ============================================================================
// Spacia — useDailyGoal
// Loads today's goal via StreakService and exposes derived progress values.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { StreakService } from "../services/StreakService";
import { AsyncResource, DailyGoal } from "../types";
import { computeDailyGoalProgress, dailyGoalMessage } from "../utils/calculations";

interface UseDailyGoalResult extends AsyncResource<DailyGoal> {
  percent: number;
  remaining: number;
  isComplete: boolean;
  message: string;
}

export function useDailyGoal(): UseDailyGoalResult {
  const [data, setData] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await StreakService.getDailyGoal();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily goal.");
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

  const progress = useMemo(
    () => (data ? computeDailyGoalProgress(data) : { percent: 0, remaining: 0, isComplete: false }),
    [data]
  );

  const message = useMemo(() => dailyGoalMessage(progress), [progress]);

  return { data, loading, refreshing, error, refresh, ...progress, message };
}
