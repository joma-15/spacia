import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ChallengeService } from "../services/ChallengeService";
import { DashboardService } from "../services/DashboardService";
import { AsyncResource, Challenge } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { subscribeResource } from "@/shared/services/resourceStore";

interface UseDailyChallengeResult extends AsyncResource<Challenge> {
  starting: boolean;
  startChallenge: () => Promise<void>;
}

export function useDailyChallenge(): UseDailyChallengeResult {
  const { cacheOwnerId, isRestoring } = useAuth();
  const [data, setData] = useState<Challenge | null>(() => {
    if (!cacheOwnerId) return null;
    return DashboardService.getCachedDashboard(cacheOwnerId)?.challenge ?? null;
  });
  const [loading, setLoading] = useState(!data);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
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
      setData(dashboard.challenge);
    } catch (err) {
      console.warn("Failed to refresh daily challenge, keeping cached data:", err);
      const cached = DashboardService.getCachedDashboard(cacheOwnerId);
      if (cached) setData(cached.challenge);
      else setError(err instanceof Error ? err.message : "Failed to load challenge.");
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
      if (cached) setData(cached.challenge);
    });
  }, [cacheOwnerId]);

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
