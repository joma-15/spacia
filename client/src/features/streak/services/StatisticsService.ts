// ============================================================================
// Spacia — StatisticsService
// Loads aggregate statistics from the authenticated dashboard endpoint.
// ============================================================================

import { Statistics } from "../types";
import { authenticatedFetch } from "@/shared/services/authenticatedFetch";

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
  async getStatistics(): Promise<Statistics> {
    const response = await authenticatedFetch("/streak/dashboard");
    const body = (await response.json()) as StatisticsResponse;
    return {
      cardsReviewed: body.statistics.cards_reviewed,
      gamesPlayed: body.statistics.games_played,
      studyTimeMinutes: body.statistics.study_time_minutes,
      xpEarned: body.statistics.xp_earned,
    };
  },
};
