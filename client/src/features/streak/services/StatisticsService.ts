// ============================================================================
// Spacia — StatisticsService
// Loads aggregate statistics from the authenticated dashboard endpoint.
// ============================================================================

import { Statistics } from "../types";
import { authenticatedFetch } from "@/shared/services/authenticatedFetch";
import { readResource, writeResource } from "@/shared/database/resourceCacheRepository";
import { FetchPolicy, loadResource } from "@/shared/services/resourceStore";

interface StatisticsResponse {
  statistics: {
    cards_reviewed: number;
    games_played: number;
    study_time_minutes: number;
    xp_earned: number;
  };
}

export const StatisticsService = {
  /** GET /streak/dashboard; completed study durations are aggregated by the database. */
  async getStatistics(userId: string, policy: FetchPolicy = "stale-while-revalidate"): Promise<Statistics> {
    return loadResource({
      userId, resource: "streak-statistics", staleTime: 2 * 60 * 1000, policy,
      readLocal: () => readResource<Statistics>(userId, "streak-statistics"),
      writeLocal: (data, updatedAt) => writeResource(userId, "streak-statistics", data, updatedAt),
      fetchRemote: async () => {
        const response = await authenticatedFetch("/streak/dashboard");
        const body = (await response.json()) as StatisticsResponse;
        return {
          cardsReviewed: body.statistics.cards_reviewed,
          gamesPlayed: body.statistics.games_played,
          studyTimeMinutes: body.statistics.study_time_minutes,
          xpEarned: body.statistics.xp_earned,
        };
      },
    });
  },
};
