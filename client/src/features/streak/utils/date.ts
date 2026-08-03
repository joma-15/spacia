// ============================================================================
// Spacia — Date Utilities
// ============================================================================

/** Returns YYYY-MM-DD for a given Date, in local time (no timezone shifting). */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Number of days in the given month (0-indexed month, like Date.getMonth()). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Short weekday label, e.g. "M", "T", "W" — used for calendar column headers. */
export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** Human friendly "N days ago" style label — used for folder "last studied". */
export function relativeDayLabel(isoDate: string): string {
  const target = new Date(isoDate);
  const now = new Date();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = startOfNow.getTime() - startOfTarget.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
