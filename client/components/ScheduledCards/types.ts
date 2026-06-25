/** How a schedule repeats */
export type ScheduleType = "one_time" | "daily" | "custom_days";

/** Abbreviated weekday labels used by the custom-days picker */
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

/** A saved flashcard pop-up schedule */
export interface SendSchedule {
  id?: string;
  folderId: string;
  folderName: string;
  cardIds: string[];
  scheduleType: ScheduleType;
  customDays: DayOfWeek[];   // only used when scheduleType === "custom_days"
  time: string;              // "HH:mm", 24h format, e.g. "20:00"
  durationMinutes: number;   // how long the session runs
  intervalMinutes: number;   // gap between pop-ups during the session
  shuffle: boolean;
  enabled: boolean;
  createdAt: number;
}

export interface Schedule {
  id: string;
  folderId: string;
  folderName: string;
  cardIds: string[];
  scheduleType: ScheduleType;
  customDays: DayOfWeek[];   // only used when scheduleType === "custom_days"
  time: string;              // "HH:mm", 24h format, e.g. "20:00"
  durationMinutes: number;   // how long the session runs
  intervalMinutes: number;   // gap between pop-ups during the session
  shuffle: boolean;
  enabled: boolean;
  createdAt: number;
}
