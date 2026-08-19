import { useCallback, useEffect, useState } from "react";
import { DashboardData, DashboardService } from "../services/DashboardService";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useDashboard() {
  const { cacheOwnerId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      if (!cacheOwnerId) return;
      setData(await DashboardService.getDashboard(cacheOwnerId, isRefresh ? "network-only" : "stale-while-revalidate"));
    } catch (err) {
      console.error("Failed to load streak dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load streak dashboard.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [cacheOwnerId]);

  useEffect(() => { void load(false); }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  return { data, loading, refreshing, error, refresh };
}
