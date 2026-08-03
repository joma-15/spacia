// ============================================================================
// Spacia — Motivational Quotes
// A random quote is selected on mount and on every pull-to-refresh.
// ============================================================================

export const MOTIVATIONAL_QUOTES: string[] = [
  "Small progress every day leads to big results.",
  "Consistency beats intensity. Show up today.",
  "Your future self is built by what you review today.",
  "Every card you learn is a rep for your brain.",
  "Discipline is choosing between what you want now and what you want most.",
  "The streak isn't the goal. The habit is.",
  "You don't have to be perfect, just present.",
  "Progress, not perfection.",
  "A little each day adds up to a lot.",
  "Focus on being 1% better than yesterday.",
];

export function getRandomQuote(excluding?: string): string {
  const pool = excluding
    ? MOTIVATIONAL_QUOTES.filter((q) => q !== excluding)
    : MOTIVATIONAL_QUOTES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
