/**
 * types.ts
 * ─────────────────────────────────────────────
 * Shared TypeScript types for the flashcard study session.
 */

/** A single flashcard with a question and its answer */
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

/** Props accepted by the main FlashcardScreen component */
export interface FlashcardScreenProps {
  /** The deck of cards to study. Falls back to demo cards if not provided. */
  cards?: Flashcard[];
  /** Called when the user finishes the deck or taps "OK" on the exit alert */
  onBack?: () => void;
  /** Called when the user confirms exiting early. Falls back to onBack if not provided. */
  onExit?: () => void;
}