// ============================================================================
// Spacia — ChallengeService
// Mimics `GET /api/challenge/today` and `POST /api/challenge/:id/start`.
// ============================================================================

import { weeklyChallenges } from "../data/dailyChallenge";
import { Challenge } from "../types";

const NETWORK_DELAY_MS = 300;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Returns today's date as YYYY-MM-DD.
 */
function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Picks today's challenge.
 *
 * Monday = 0
 * Tuesday = 1
 * ...
 * Sunday = 6
 *
 * Rotates the challenge every week.
 */
function generateTodayChallenge(): Challenge {
  const now = new Date();

  // Convert JS Sunday-first to Monday-first
  const dayIndex = (now.getDay() + 6) % 7;

  // Week number since Unix epoch
  const weekNumber = Math.floor(
    now.getTime() / (1000 * 60 * 60 * 24 * 7)
  );

  const challenges = weeklyChallenges[dayIndex];

  const challenge =
    challenges[weekNumber % challenges.length];

  return {
    ...challenge,
    progress: 0,
    completed: false,
  };
}

// Current day's cache
let currentDate = getTodayKey();
let challengeState: Challenge = generateTodayChallenge();

export const ChallengeService = {
  /**
   * GET /api/challenge/today
   */
  async getTodayChallenge(): Promise<Challenge> {
    const today = getTodayKey();

    // Automatically switch challenge when a new day begins
    if (today !== currentDate) {
      currentDate = today;
      challengeState = generateTodayChallenge();
    }

    return delay({ ...challengeState });
  },

  /**
   * POST /api/challenge/:id/start
   */
  async startChallenge(id: string): Promise<Challenge> {
    const today = getTodayKey();

    // Refresh challenge if the day changed
    if (today !== currentDate) {
      currentDate = today;
      challengeState = generateTodayChallenge();
    }

    if (challengeState.id === id && !challengeState.completed) {
      const nextProgress = Math.min(
        challengeState.progress + 5,
        challengeState.target
      );

      challengeState = {
        ...challengeState,
        progress: nextProgress,
        completed: nextProgress >= challengeState.target,
      };
    }

    return delay({ ...challengeState });
  },
};