import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { DashboardService } from "../services/DashboardService";
import { AsyncResource, DailyGoal } from "../types";
import { computeDailyGoalProgress, dailyGoalMessage } from "../utils/calculations";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { subscribeResource } from "@/shared/services/resourceStore";

interface UseDailyGoalResult extends AsyncResource<DailyGoal> {
  percent: number;
  remaining: number;
  isComplete: boolean;
  message: string;
}

export function useDailyGoal(): UseDailyGoalResult {
  const { cacheOwnerId, isRestoring } = useAuth();
  const [data, setData] = useState<DailyGoal | null>(() => {
    if (!cacheOwnerId) return null;
    return DashboardService.getCachedDashboard(cacheOwnerId)?.dailyGoal ?? null;
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
      setData(dashboard.dailyGoal);
    } catch (err) {
      console.warn("Failed to refresh daily goal, keeping cached data:", err);
      const cached = DashboardService.getCachedDashboard(cacheOwnerId);
      if (cached) setData(cached.dailyGoal);
      else setError(err instanceof Error ? err.message : "Failed to load daily goal.");
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
      if (cached) setData(cached.dailyGoal);
    });
  }, [cacheOwnerId]);

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
