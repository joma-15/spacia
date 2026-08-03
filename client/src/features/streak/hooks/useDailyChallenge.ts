// ============================================================================
// Spacia — useDailyChallenge
// Exposes both the loaded challenge and a `startChallenge()` action, mirroring
// how a real mutation (POST) would be wired once the backend exists.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { ChallengeService } from "../services/ChallengeService";
import { AsyncResource, Challenge } from "../types";

interface UseDailyChallengeResult extends AsyncResource<Challenge> {
  starting: boolean;
  startChallenge: () => Promise<void>;
}

export function useDailyChallenge(): UseDailyChallengeResult {
  const [data, setData] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await ChallengeService.getTodayChallenge();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenge.");
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

  const startChallenge = useCallback(async () => {
    if (!data || data.completed) return;
    try {
      setStarting(true);
      const result = await ChallengeService.startChallenge(data.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start challenge.");
    } finally {
      setStarting(false);
    }
  }, [data]);

  return { data, loading, refreshing, error, refresh, starting, startChallenge };
}
