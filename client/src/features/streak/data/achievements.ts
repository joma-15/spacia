// ============================================================================
// Spacia — Mock Data: Achievements
// Shape mirrors what GET /api/achievements would return. `locked` is stored
// explicitly (a backend business rule may unlock things for reasons beyond
// simple progress >= target), while progress badges are still derived from
// progress/target in the UI layer.
// ============================================================================

import { Achievement } from "../types";

export const mockAchievements: Achievement[] = [
  {
    id: "ach-1",
    title: "7 Day Streak",
    description: "Study every day for a full week.",
    icon: "fire",
    locked: false,
    progress: 7,
    target: 7,
  },
  {
    id: "ach-2",
    title: "First Folder",
    description: "Create your first flashcard folder.",
    icon: "folder-star-outline",
    locked: false,
    progress: 1,
    target: 1,
  },
  {
    id: "ach-3",
    title: "AI Explorer",
    description: "Generate flashcards with AI 5 times.",
    icon: "creation",
    locked: false,
    progress: 3,
    target: 5,
  },
  {
    id: "ach-4",
    title: "Flashcard Master",
    description: "Review 500 flashcards total.",
    icon: "cards-outline",
    locked: true,
    progress: 342,
    target: 500,
  },
  {
    id: "ach-5",
    title: "Gamer",
    description: "Play 25 study games.",
    icon: "gamepad-variant-outline",
    locked: true,
    progress: 18,
    target: 25,
  },
  {
    id: "ach-6",
    title: "Night Owl",
    description: "Study after 10pm five times.",
    icon: "weather-night",
    locked: true,
    progress: 1,
    target: 5,
  },
];
