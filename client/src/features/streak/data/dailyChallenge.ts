import { Challenge } from "../types";

export const weeklyChallenges: Record<number, Challenge[]> = {
  // Monday
  0: [
    {
      id: "mon-1",
      title: "Review 30 Flashcards",
      description: "Complete 30 flashcard reviews today.",
      rewardXP: 100,
      completed: false,
      progress: 0,
      target: 30,
    },
    {
      id: "mon-2",
      title: "Study for 20 Minutes",
      description: "Spend at least 20 minutes studying.",
      rewardXP: 80,
      completed: false,
      progress: 0,
      target: 20,
    },
    {
      id: "mon-3",
      title: "Complete 2 Study Sessions",
      description: "Finish two study sessions today.",
      rewardXP: 120,
      completed: false,
      progress: 0,
      target: 2,
    },
  ],

  // Tuesday
  1: [
    {
      id: "tue-1",
      title: "Create 10 Flashcards",
      description: "Add 10 new flashcards to any deck.",
      rewardXP: 120,
      completed: false,
      progress: 0,
      target: 10,
    },
    {
      id: "tue-2",
      title: "Learn 20 New Cards",
      description: "Study 20 cards you've never reviewed.",
      rewardXP: 110,
      completed: false,
      progress: 0,
      target: 20,
    },
    {
      id: "tue-3",
      title: "Review 50 Flashcards",
      description: "Complete 50 flashcard reviews.",
      rewardXP: 150,
      completed: false,
      progress: 0,
      target: 50,
    },
  ],

  // Wednesday
  2: [
    {
      id: "wed-1",
      title: "Master 10 Flashcards",
      description: "Get 10 cards marked as mastered.",
      rewardXP: 130,
      completed: false,
      progress: 0,
      target: 10,
    },
    {
      id: "wed-2",
      title: "Study 3 Decks",
      description: "Study from three different decks.",
      rewardXP: 140,
      completed: false,
      progress: 0,
      target: 3,
    },
    {
      id: "wed-3",
      title: "Perfect Quiz",
      description: "Score 100% on one quiz.",
      rewardXP: 180,
      completed: false,
      progress: 0,
      target: 1,
    },
  ],

  // Thursday
  3: [
    {
      id: "thu-1",
      title: "Study for 45 Minutes",
      description: "Spend 45 minutes studying today.",
      rewardXP: 160,
      completed: false,
      progress: 0,
      target: 45,
    },
    {
      id: "thu-2",
      title: "Review Difficult Cards",
      description: "Review 20 difficult flashcards.",
      rewardXP: 150,
      completed: false,
      progress: 0,
      target: 20,
    },
    {
      id: "thu-3",
      title: "Complete 3 Study Sessions",
      description: "Finish three study sessions.",
      rewardXP: 170,
      completed: false,
      progress: 0,
      target: 3,
    },
  ],

  // Friday
  4: [
    {
      id: "fri-1",
      title: "Create a New Deck",
      description: "Create one new flashcard deck.",
      rewardXP: 90,
      completed: false,
      progress: 0,
      target: 1,
    },
    {
      id: "fri-2",
      title: "Add 20 Flashcards",
      description: "Add 20 new flashcards.",
      rewardXP: 150,
      completed: false,
      progress: 0,
      target: 20,
    },
    {
      id: "fri-3",
      title: "Review 100 Flashcards",
      description: "Complete 100 flashcard reviews.",
      rewardXP: 220,
      completed: false,
      progress: 0,
      target: 100,
    },
  ],

  // Saturday
  5: [
    {
      id: "sat-1",
      title: "Study 5 Decks",
      description: "Study five different decks.",
      rewardXP: 180,
      completed: false,
      progress: 0,
      target: 5,
    },
    {
      id: "sat-2",
      title: "Study for 60 Minutes",
      description: "Spend one hour studying.",
      rewardXP: 200,
      completed: false,
      progress: 0,
      target: 60,
    },
    {
      id: "sat-3",
      title: "Complete 5 Study Sessions",
      description: "Finish five study sessions.",
      rewardXP: 250,
      completed: false,
      progress: 0,
      target: 5,
    },
  ],

  // Sunday
  6: [
    {
      id: "sun-1",
      title: "Weekly Review",
      description: "Review 150 flashcards today.",
      rewardXP: 300,
      completed: false,
      progress: 0,
      target: 150,
    },
    {
      id: "sun-2",
      title: "Finish All Reviews",
      description: "Complete every scheduled review today.",
      rewardXP: 350,
      completed: false,
      progress: 0,
      target: 1,
    },
    {
      id: "sun-3",
      title: "Study Marathon",
      description: "Study for 90 minutes today.",
      rewardXP: 400,
      completed: false,
      progress: 0,
      target: 90,
    },
  ],
};