import { db } from "./database";
import { Schedule } from "../../components/ScheduledCards/types";

// Returns all locally stored schedules
export async function loadLocalSchedule(): Promise<Schedule[]> {
  const schedules = await db.getAllAsync<any>(
    `SELECT * FROM schedules`
  );

  const result: Schedule[] = [];

  for (const row of schedules) {
    const folder = await db.getFirstAsync<any>(
      `SELECT subject FROM folders WHERE id = ?`,
      [row.folder_id]
    );

    const cards = await db.getAllAsync<any>(
      `SELECT id FROM flashcards WHERE folder_id = ?`,
      [row.folder_id]
    );

    result.push({
      id: row.id,
      folderId: row.folder_id,
      folderName: folder?.subject ?? "Unknown Folder",
      cardIds: cards.map(card => card.id),

      scheduleType: row.schedule_type,
      customDays: row.custom_days
        ? JSON.parse(row.custom_days)
        : [],

      time: row.time,
      durationMinutes: row.duration_minutes,
      intervalMinutes: row.interval_minutes,
      shuffle: Boolean(row.shuffle),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at,
    });
  }
  console.log("loaded local schedules", result);
  return result;
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

// Deletes a schedule from the local SQLite database
export async function deleteLocalSchedule(id: string): Promise<void> {
  await db.runAsync(
    `DELETE FROM schedules WHERE id = ?`,
    [id]
  );
  console.log("deleted the schedule");
}