/**
 * types.ts
 * ─────────────────────────────────────────────
 * All shared TypeScript types for the Library feature.
 *
 * Keeping types in one place means if you ever change a shape
 * (e.g. add a "description" field to Folder), you only edit here
 * and TypeScript will tell you everywhere else that needs updating.
 */

/** A single subject folder that holds flashcards */
export interface Folder {
  id: string;         // unique ID (we use Date.now() as a string)    // unique ID (we use Date.now() as a string)
  subject: string;    // name shown on the card, e.g. "Physics"
  cardCount: number;  // number of flashcards inside this folder
  accentColor: string; // hex color string, e.g. "#4A90D9"
}

/**
 * The five tabs in the bottom navigation bar.
 * Each string matches an item id in NAV_ITEMS inside constants.ts
 */
export type NavTab = "streak" | "game" | "add" | "library" | "payment";



/** A single flashcard belonging to a folder */
export interface Flashcard {
  id: string;
  folderId: string;
  question: string;
  answer: string;
  difficulty?: "again" | "hard" | "easy" | "mastered";
}

/** How a schedule repeats */
export type ScheduleType = "one_time" | "daily" | "custom_days";

/** Abbreviated weekday labels used by the custom-days picker */
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

/** A saved flashcard pop-up schedule */
export interface Schedule {
  id: string;
  folderId: string;
  folderName: string;
  cardIds: string[];
  scheduleType: ScheduleType;
  customDays: DayOfWeek[];   // only used when scheduleType === "custom_days"
  time: string;              // "HH:mm", 24h format, e.g. "20:00"
  durationMinutes: number;   // how long the session runs
  intervalMinutes: number;   // gap between pop-ups during the session
  shuffle: boolean;
  enabled: boolean;
  createdAt: number;
}