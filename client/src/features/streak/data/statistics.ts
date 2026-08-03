// ============================================================================
// Spacia — Mock Data: Statistics
// Shape mirrors what GET /api/statistics would return.
// ============================================================================

import { Statistics } from "../types";

export const mockStatistics: Statistics = {
  cardsReviewed: 342,
  gamesPlayed: 18,
  studyTimeMinutes: 465, // displayed as hours/minutes in the UI
  xpEarned: 2140,
};
