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
export type NavTab = "profile" | "streak" | "add" | "popup" | "stats";