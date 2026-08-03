// ============================================================================
// Spacia — StreakService
// Mimics `GET /api/streak` and `GET /api/goal/today`. Replace the bodies of
// these methods with `fetch()` calls (using a JWT-authenticated client) when
// the Flask backend is ready — hooks and components will not need to change.
// ============================================================================

import { mockDailyGoal, mockStreakInfo } from "../data/streakData";
import { DailyGoal, StreakInfo } from "../types";

const NETWORK_DELAY_MS = 300;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const StreakService = {
  /** GET /api/streak */
  async getStreak(): Promise<StreakInfo> {
    return delay({ ...mockStreakInfo });
  },

  /** GET /api/goal/today */
  async getDailyGoal(): Promise<DailyGoal> {
    return delay({ ...mockDailyGoal });
  },
};
