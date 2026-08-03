// ============================================================================
// Spacia — StatisticsService
// Mimics `GET /api/statistics`.
// ============================================================================

import { mockStatistics } from "../data/statistics";
import { Statistics } from "../types";

const NETWORK_DELAY_MS = 350;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const StatisticsService = {
  /** GET /api/statistics */
  async getStatistics(): Promise<Statistics> {
    return delay({ ...mockStatistics });
  },
};
