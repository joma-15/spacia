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
export async function saveNewSchedules(schedules: Schedule): Promise<void> {
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
        schedules.id,
        schedules.folderId,
        schedules.scheduleType,
        schedules.customDays.length > 0
          ? JSON.stringify(schedules.customDays)
          : null,
        schedules.time,
        schedules.durationMinutes,
        schedules.intervalMinutes,
        schedules.shuffle,
        schedules.enabled,
        schedules.createdAt,
      ],
    );
  console.log(schedules);
}

// Deletes a schedule from the local SQLite database
export async function deleteLocalSchedule(id: string): Promise<void> {
  await db.runAsync(
    `DELETE FROM schedules WHERE id = ?`,
    [id]
  );
  console.log("deleted the schedule from local");
}

export async function resetSchedules(): Promise<void> {
  await db.runAsync(`DELETE FROM schedules`);
  console.log("All schedules deleted.");
}

//update the toggle 
export async function updateLocalToggle(id : string, enabled : boolean): Promise<void>{
  await db.runAsync(
    `
    UPDATE schedules
    SET enabled =?
    WHERE id = ?;
    `, 
    enabled, 
    id
  );
  console.log("updage the toggle ");
}