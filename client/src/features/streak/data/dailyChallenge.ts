// ============================================================================
// Spacia — Mock Data: Daily Challenge
// Shape mirrors what GET /api/challenge/today would return.
// ============================================================================

import { Challenge } from "../types";

export const mockDailyChallenge: Challenge = {
  id: "challenge-2026-08-03",
  title: "Review 30 flashcards",
  description: "Complete 30 flashcard reviews across any folder today.",
  rewardXP: 100,
  completed: false,
  progress: 15,
  target: 30,
};
