// ============================================================================
// Spacia — Business Logic: Derived Calculations
// Every percentage / remaining-value shown in the UI is computed here from
// raw counts, never hardcoded in a component.
// ============================================================================

import { DailyGoal, DailyGoalProgress, Folder, FolderProgress } from "../types";

/** Clamp a number between 0 and 100 and round to the nearest whole percent. */
export function toPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  const raw = (numerator / denominator) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Compute mastery %, remaining cards, and completion % for a folder. */
export function computeFolderProgress(folder: Folder): FolderProgress {
  const masteryPercent = toPercent(folder.understoodCards, folder.totalCards);
  const completionPercent = toPercent(folder.reviewCards, folder.totalCards);
  const remainingCards = Math.max(folder.totalCards - folder.reviewCards, 0);

  return { masteryPercent, remainingCards, completionPercent };
}

/** Compute percent complete, cards remaining, and completion flag for today's goal. */
export function computeDailyGoalProgress(goal: DailyGoal): DailyGoalProgress {
  const percent = toPercent(goal.completed, goal.target);
  const remaining = Math.max(goal.target - goal.completed, 0);
  const isComplete = goal.completed >= goal.target;

  return { percent, remaining, isComplete };
}

/** Motivational copy that reacts to actual progress rather than a static string. */
export function dailyGoalMessage(progress: DailyGoalProgress): string {
  if (progress.isComplete) return "Goal complete! Great work today.";
  if (progress.percent >= 75) return "You're almost there!";
  if (progress.percent >= 40) return "Nice pace, keep it going.";
  if (progress.percent > 0) return "You've made a start — keep going.";
  return "Let's get today's reviews started.";
}

/** Achievement progress percent, clamped to target. */
export function achievementProgressPercent(progress: number, target: number): number {
  return toPercent(progress, target);
}
