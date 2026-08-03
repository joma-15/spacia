// ============================================================================
// Spacia — Mock Data: Study Calendar
// A real backend would return a list of {date, status} entries for the
// current month. Here we generate the current month locally and assign a
// deterministic-but-varied status per day so the calendar always looks
// populated, no matter when this runs.
// ============================================================================

import { CalendarDay, CalendarDayStatus } from "../types";
import { daysInMonth, toISODate } from "../utils/date";

/** Days (by day-of-month) that are treated as "missed" in the mock data. */
const MOCK_MISSED_DAYS = new Set([3, 9, 14, 22]);

export function generateMockCalendar(reference: Date = new Date()): CalendarDay[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const totalDays = daysInMonth(year, month);
  const todayISO = toISODate(reference);
  const days: CalendarDay[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const iso = toISODate(date);

    let status: CalendarDayStatus;
    if (iso === todayISO) {
      status = "today";
    } else if (date > reference) {
      status = "future";
    } else if (MOCK_MISSED_DAYS.has(day)) {
      status = "missed";
    } else {
      status = "completed";
    }

    days.push({ date: iso, day, status });
  }

  return days;
}

export const mockCalendarDays: CalendarDay[] = generateMockCalendar();
