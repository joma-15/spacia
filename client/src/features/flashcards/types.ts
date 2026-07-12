/** Shared TypeScript types used across the flashcard feature */

export type CardStatus = "review" | "understood";
export type TabType = "all" | "review" | "understood";

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  status: CardStatus;
}