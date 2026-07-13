// src/database/database.ts

import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("spacia.db");

/**
 * Create the offline-cache tables once. `IF NOT EXISTS` makes this safe to run
 * on every app launch; it does not erase existing users' cached data.
 */
export function initializeDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      accent_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      folder_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      status TEXT CHECK (status IN ('review', 'understood')),
      FOREIGN KEY (folder_id) REFERENCES folders(id)
    );

    -- Folder views query cards by folder_id repeatedly, so this index avoids a
    -- full flashcard-table scan as a user's deck grows.
    CREATE INDEX IF NOT EXISTS idx_flashcards_folder
      ON flashcards(folder_id);

    CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    schedule_type TEXT NOT NULL,
    custom_days TEXT,
    time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    interval_minutes INTEGER NOT NULL,
    shuffle INTEGER NOT NULL DEFAULT 1,
    enabled INTEGER NOT NULL DEFAULT 1,

    notification_id TEXT,

    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending_create'
  );

  
  `);
}
