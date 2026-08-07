// ============================================================================
// Spacia — Mock Data: Folders
// Shape mirrors what GET /api/folders would return. Mastery, remaining, and
// completion are intentionally NOT stored here — they're derived at render
// time via utils/calculations.ts.
// ============================================================================

import { Folder } from "../types";

export const mockFolders: Folder[] = [
  {
    id: "folder-1",
    title: "Spanish Vocabulary",
    color: "#34D399",
    icon: "folder-outline",
    totalCards: 120,
    reviewCards: 96,
    understoodCards: 84,
    lastStudied: "2026-08-03",
  },
  {
    id: "folder-2",
    title: "Organic Chemistry",
    color: "#60A5FA",
    icon: "folder-outline",
    totalCards: 85,
    reviewCards: 40,
    understoodCards: 22,
    lastStudied: "2026-08-02",
  },
  {
    id: "folder-3",
    title: "World History",
    color: "#FBBF24",
    icon: "folder-outline",
    totalCards: 60,
    reviewCards: 60,
    understoodCards: 55,
    lastStudied: "2026-07-30",
  },
  {
    id: "folder-4",
    title: "Data Structures",
    color: "#F87171",
    icon: "folder-outline",
    totalCards: 45,
    reviewCards: 10,
    understoodCards: 4,
    lastStudied: "2026-07-27",
  },
  {
    id: "folder-5",
    title: "Anatomy Basics",
    color: "#A78BFA",
    icon: "folder-outline",
    totalCards: 96,
    reviewCards: 70,
    understoodCards: 61,
    lastStudied: "2026-07-25",
  },
];
