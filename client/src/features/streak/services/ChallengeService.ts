// ============================================================================
// Spacia — ChallengeService
// Mimics `GET /api/challenge/today` and `POST /api/challenge/:id/start`.
// ============================================================================

import { mockDailyChallenge } from "../data/dailyChallenge";
import { Challenge } from "../types";

const NETWORK_DELAY_MS = 300;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// In-memory copy so "starting" a challenge can mutate state between calls,
// the same way a real backend session would.
let challengeState: Challenge = { ...mockDailyChallenge };

export const ChallengeService = {
  /** GET /api/challenge/today */
  async getTodayChallenge(): Promise<Challenge> {
    return delay({ ...challengeState });
  },

  /** POST /api/challenge/:id/start — nudges progress forward to simulate starting a session. */
  async startChallenge(id: string): Promise<Challenge> {
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
