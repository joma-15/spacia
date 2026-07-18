/**
 * types.ts
 * ─────────────────────────────────────────────
 * Shared TypeScript types for the Flip & Sort game.
 */

/** A single flashcard with a question and its answer */
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status?: "review" | "understood" | null;
}

/** Props accepted by the main FlipSortScreen component */
export interface FlipSortScreenProps {
  /** The deck of cards to play. Falls back to folder cards if not provided. */
  cards?: Flashcard[];
  /** Called when the user exits or finishes the game */
  onBack?: () => void;
}
