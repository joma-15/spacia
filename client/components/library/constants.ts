/**
 * constants.ts
 * ─────────────────────────────────────────────
 * Static data arrays that never change at runtime.
 *
 * Keeping these here (not inside components) means:
 *  - They don't get re-created on every render
 *  - Multiple components can share them without prop-drilling
 */

import { THEME } from "./theme";
import type { NavTab } from "./types";

// ─── Folder color picker options ─────────────────────────────────────────────

/**
 * The color swatches shown in the "Add Folder" modal.
 * label  → shown as accessible hint (could be used for screen readers)
 * value  → the actual hex color stored on the folder
 */
export const ACCENT_COLORS: { label: string; value: string }[] = [
  { label: "Blue",   value: THEME.folderBlue   },
  { label: "Green",  value: THEME.folderGreen  },
  { label: "Red",    value: THEME.folderRed    },
  { label: "Gold",   value: THEME.folderGold   },
  { label: "Purple", value: THEME.folderPurple },
  { label: "Orange", value: THEME.folderOrange },
  { label: "Pink",   value: THEME.folderPink   },
  { label: "Cyan",   value: THEME.folderCyan   },
];

// ─── Bottom navigation items ──────────────────────────────────────────────────

/**
 * Defines every tab in the bottom navigation bar.
 * isCenter → renders the big "+" floating button instead of a normal tab
 */
export const NAV_ITEMS: {
  id: NavTab;
  label: string;
  emoji: string;
  isCenter?: boolean;
}[] = [
  { id: "streakcomingsoon",  label: "Streak",  emoji: "🔥"           },
   { id: "comingsoon", label: "Games", emoji: "🎮"           },
  { id: "add",     label: "",        emoji: "+", isCenter: true },
  { id: "library",   label: "Library", emoji: "📂"           },
  { id: "payment",   label: "Premium", emoji: "👑"           },
];


import type { DayOfWeek } from "./types";

export const DAYS_OF_WEEK: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DURATION_PRESETS: { label: string; minutes: number }[] = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
];

export const INTERVAL_PRESETS: { label: string; minutes: number }[] = [
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
];

export const WIZARD_STEPS = ["Folder", "Cards", "Schedule", "Review"] as const;