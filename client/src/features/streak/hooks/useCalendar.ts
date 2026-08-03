// ============================================================================
// Spacia — useCalendar
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { CalendarService } from "../services/CalendarService";
import { AsyncResource, CalendarDay } from "../types";

export function useCalendar(): AsyncResource<CalendarDay[]> {
  const [data, setData] = useState<CalendarDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await CalendarService.getMonth();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar.");
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
