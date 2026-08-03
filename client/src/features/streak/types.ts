// ============================================================================
// Spacia — Streak Dashboard — Shared Types
// ----------------------------------------------------------------------------
// These interfaces describe the shape of data flowing between the (future)
// Flask API and the UI. Every service and hook in this feature is typed
// against these contracts so that swapping mock services for real HTTP
// calls later requires zero changes to components.
// ============================================================================

/** A single folder of flashcards belonging to the user. */
export interface Folder {
  id: string;
  title: string;
  /** Hex color used for the folder icon background / accents. */
  color: string;
  /** MaterialCommunityIcons icon name. */
  icon: string;
  totalCards: number;
  reviewCards: number;
  understoodCards: number;
  /** ISO date string of the last time this folder was studied. */
  lastStudied: string;
}

/** Derived (computed) values for a folder — never stored, always calculated. */
export interface FolderProgress {
  masteryPercent: number;
  remainingCards: number;
  completionPercent: number;
}

/** Today's review goal. */
export interface DailyGoal {
  target: number;
  completed: number;
}

/** Derived values for the daily goal. */
export interface DailyGoalProgress {
  percent: number;
  remaining: number;
  isComplete: boolean;
}

/** A single unlockable/lockable achievement. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  locked: boolean;
  progress: number;
  target: number;
}

/** Streak information for the user. */
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  freezesAvailable: number;
}

/** Aggregate study statistics. */
export interface Statistics {
  cardsReviewed: number;
  gamesPlayed: number;
  studyTimeMinutes: number;
  xpEarned: number;
}

/** Status of a single day in the monthly calendar. */
export type CalendarDayStatus = "completed" | "missed" | "today" | "future" | "inactive";

/** A single day cell in the study calendar. */
export interface CalendarDay {
  date: string; // ISO date (yyyy-mm-dd)
  day: number; // day of month
  status: CalendarDayStatus;
}

/** Today's daily challenge. */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  completed: boolean;
  progress: number;
  target: number;
}

/** Overall progress snapshot — used where multiple derived stats are needed together. */
export interface UserProgress {
  streak: StreakInfo;
  statistics: Statistics;
  dailyGoal: DailyGoal;
}

/** Generic async resource shape returned by every data hook in this feature. */
export interface AsyncResource<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
