import { FlashCard } from "../types";
import { RECENT_ANSWER_HISTORY_SIZE } from "../constants";
import { fisherYatesShuffle } from "./shuffle";

/**
 * AnswerPool — picks random "wrong answer" text (distractors) to show
 * next to the correct answer, pulling only from real answers already
 * in the flashcard deck. It never makes up fake answers.
 *
 * WHY THIS EXISTS INSTEAD OF A SIMPLE RANDOM PICK:
 * A naive approach re-shuffles or re-filters the ENTIRE flashcard list
 * every single time we need one new answer. That's fine for 20 cards,
 * but slow once a deck has thousands of cards, since we'd redo that
 * work every time a bubble gets destroyed.
 *
 * Instead, this class:
 *  1. Shuffles a list of "slots" (indexes into the deck) ONE time.
 *  2. Hands out answers by walking through that shuffled list with a
 *     cursor — grabbing the next one is instant (no re-shuffling).
 *  3. Reshuffles again only once we reach the end of the list, so a
 *     full deck is only touched a handful of times, not once per pick.
 *  4. Remembers a few recently-shown answers so the same distractor
 *     doesn't reappear immediately after being shown.
 */
export class AnswerPool {
  private cards: FlashCard[];
  private order: number[] = [];
  private cursor = 0;
  private recentQueue: string[] = [];
  private recentSet: Set<string> = new Set();
  private recentCap: number;

  constructor(cards: FlashCard[]) {
    this.cards = cards;
    this.recentCap = AnswerPool.computeRecentCap(cards.length);
    this.reshuffle();
  }

  // Never let the "avoid repeats" window swallow the whole pool —
  // otherwise a small deck could run out of allowed answers.
  private static computeRecentCap(cardCount: number): number {
    return Math.max(1, Math.min(RECENT_ANSWER_HISTORY_SIZE, cardCount - 1));
  }

  private reshuffle() {
    const indices = Array.from({ length: this.cards.length }, (_, i) => i);
    this.order = fisherYatesShuffle(indices);
    this.cursor = 0;
  }

  private markRecent(answer: string) {
    if (this.recentSet.has(answer)) return;
    this.recentQueue.push(answer);
    this.recentSet.add(answer);
    while (this.recentQueue.length > this.recentCap) {
      const removed = this.recentQueue.shift();
      if (removed !== undefined) this.recentSet.delete(removed);
    }
  }

  /**
   * Call this whenever the whole flashcard deck changes (e.g. the player
   * picked a different study folder). Resets shuffling and recent-answer
   * memory so nothing from the old deck leaks into the new one.
   */
  updateCards(cards: FlashCard[]) {
    this.cards = cards;
    this.recentCap = AnswerPool.computeRecentCap(cards.length);
    this.recentQueue = [];
    this.recentSet.clear();
    this.reshuffle();
  }

  /**
   * Picks ONE distractor answer that:
   *  - is not already shown on screen (passed in as `exclude`)
   *  - was not shown very recently, when possible
   * Returns null only if there truly is nothing left to give (e.g. a
   * deck with just one unique answer).
   */
  pickDistractor(exclude: Set<string>): string | null {
    const n = this.cards.length;
    if (n === 0) return null;

    const maxAttempts = n * 2; // bounded, so this can never loop forever
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (this.cursor >= this.order.length) this.reshuffle();
      const idx = this.order[this.cursor++];
      attempts++;

      const candidate = this.cards[idx]?.answer;
      if (!candidate) continue;
      if (exclude.has(candidate)) continue;
      if (this.recentSet.has(candidate)) continue;

      this.markRecent(candidate);
      return candidate;
    }

    // Fallback for tiny decks: the "avoid recent" rule used up every
    // option, so just guarantee the answer isn't already on screen.
    for (const card of this.cards) {
      if (!exclude.has(card.answer)) {
        this.markRecent(card.answer);
        return card.answer;
      }
    }

    return null;
  }
}

/**
 * Builds the starting list of answers for one question: the correct
 * answer plus a handful of unique distractors, shuffled together so the
 * correct answer isn't always in the same spot.
 */
export function pickInitialAnswers(
  correctAnswer: string,
  pool: AnswerPool,
  count: number,
): string[] {
  const shown = new Set<string>([correctAnswer]);
  const result = [correctAnswer];
  const wantedDistractors = Math.max(0, count - 1);

  for (let i = 0; i < wantedDistractors; i++) {
    const candidate = pool.pickDistractor(shown);
    if (candidate === null) break; // pool ran out, keep what we have
    shown.add(candidate);
    result.push(candidate);
  }

  return fisherYatesShuffle(result);
}
