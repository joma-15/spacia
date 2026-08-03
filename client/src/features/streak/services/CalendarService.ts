// ============================================================================
// Spacia — CalendarService
// Mimics `GET /api/calendar?month=YYYY-MM`.
// ============================================================================

import { generateMockCalendar } from "../data/calendar";
import { CalendarDay } from "../types";

const NETWORK_DELAY_MS = 300;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const CalendarService = {
  /** GET /api/calendar?month=YYYY-MM */
  async getMonth(reference: Date = new Date()): Promise<CalendarDay[]> {
    return delay(generateMockCalendar(reference));
  },
};
