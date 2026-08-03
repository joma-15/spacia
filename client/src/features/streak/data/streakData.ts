// ============================================================================
// Spacia — Mock Data: Streak
// Shape mirrors what GET /api/streak would return from the Flask backend.
// ============================================================================

import { DailyGoal, StreakInfo } from "../types";
import { toISODate } from "../utils/date";

export const mockStreakInfo: StreakInfo = {
  currentStreak: 7,
  longestStreak: 21,
  lastActiveDate: toISODate(new Date()),
  freezesAvailable: 2,
};

export const mockDailyGoal: DailyGoal = {
  target: 20,
  completed: 15,
};
