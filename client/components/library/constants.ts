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
  { id: "profile", label: "Profile", emoji: "👤"           },
  { id: "streak",  label: "Streak",  emoji: "🔥"           },
  { id: "add",     label: "",        emoji: "+", isCenter: true },
  { id: "popup",   label: "Library", emoji: "📂"           },
  { id: "stats",   label: "Premium", emoji: "👑"           },
];