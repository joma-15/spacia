// ============================================================================
// Spacia — AchievementService
// Mimics `GET /api/achievements`.
// ============================================================================

import { mockAchievements } from "../data/achievements";
import { Achievement } from "../types";

const NETWORK_DELAY_MS = 350;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const AchievementService = {
  /** GET /api/achievements */
  async getAchievements(): Promise<Achievement[]> {
    return delay(mockAchievements.map((achievement) => ({ ...achievement })));
  },
};
