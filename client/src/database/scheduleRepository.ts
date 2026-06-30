import { db } from "./database";
import { Schedule } from "../../components/ScheduledCards/types";

// Returns all locally stored schedules
export async function loadLocalSchedule(): Promise<Schedule[]> {
  const rows = await db.getAllAsync<Schedule>(`SELECT * FROM schedules`);
  console.log("loaded data from sqlite");
  return rows;
}

// Saves only schedules that don't already exist locally
export async function saveNewSchedules(schedules: Schedule[]): Promise<void> {
  for (const schedule of schedules) {
    await db.runAsync(
      `
      INSERT OR IGNORE INTO schedules (
        id,
        folder_id,
        schedule_type,
        custom_days,
        time,
        duration_minutes,
        interval_minutes,
        shuffle,
        enabled,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        schedule.id,
        schedule.folderId,
        schedule.scheduleType,
        schedule.customDays.length > 0
          ? JSON.stringify(schedule.customDays)
          : null,
        schedule.time,
        schedule.durationMinutes,
        schedule.intervalMinutes,
        schedule.shuffle,
        schedule.enabled,
        schedule.createdAt,
      ],
    );
  }
}