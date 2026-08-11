import { useCallback, useEffect, useState } from "react";
import { DashboardData, DashboardService } from "../services/DashboardService";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setData(await DashboardService.getDashboard());
    } catch (err) {
      console.error("Failed to load streak dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load streak dashboard.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestId = setTimeout(() => void load(false), 0);
    return () => clearTimeout(requestId);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  return { data, loading, refreshing, error, refresh };
}
