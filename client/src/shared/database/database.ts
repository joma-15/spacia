// src/database/database.ts

import * as SQLite from "expo-sqlite";

// Open (or create if it doesn't exist) a local SQLite database file named 'spacia.db'.
// This database runs offline on the user's phone, acting as a cache so the app can work without internet.
export const db = SQLite.openDatabaseSync("spacia.db");

/**
 * Initialize all database tables needed for our offline-cache.
 * Running `CREATE TABLE IF NOT EXISTS` is completely safe to call on every app boot 
 * because SQLite will only build the tables if they are missing. It will never overwrite 
 * or erase the user's existing saved study data.
 */
export function initializeDatabase() {
  db.execSync(`
    -- 1. Folders Table: Stores subject groups (e.g. "Physics", "Chemistry")
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,           -- Unique identifier for the folder
      subject TEXT NOT NULL,         -- The name of the subject
      accent_color TEXT NOT NULL     -- Color code used in the UI theme
    );

    -- 2. Flashcards Table: Stores individual study cards
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,           -- Unique identifier for the card
      folder_id TEXT NOT NULL,       -- Links card to its parent folder (foreign key)
      question TEXT NOT NULL,        -- The question/front text
      answer TEXT NOT NULL,          -- The answer/back text
      status TEXT CHECK (status IN ('review', 'understood')), -- Status check (only allow review or understood)
      FOREIGN KEY (folder_id) REFERENCES folders(id) -- Connects to folders table
    );

    -- Speed Optimizer: Creating an index on folder_id.
    -- As a user's collection grows to hundreds of flashcards, search queries for a single folder 
    -- would slow down because SQLite has to scan every row (full-table scan). An index acts like an
    -- alphabetical book index, letting SQLite find the folder's cards instantly.
    CREATE INDEX IF NOT EXISTS idx_flashcards_folder
      ON flashcards(folder_id);

    -- 3. Schedules Table: Stores notification reminder times
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,           -- Unique identifier for the schedule
      folder_id TEXT NOT NULL,       -- Folder linked to the reminder
      schedule_type TEXT NOT NULL,   -- Frequency type (e.g. daily, weekly, custom)
      custom_days TEXT,              -- Selected days of the week (stored as text list)
      time TEXT NOT NULL,            -- Time of day (e.g. '09:00')
      duration_minutes INTEGER NOT NULL,  -- Duration of study session
      interval_minutes INTEGER NOT NULL,  -- Frequency interval (e.g. every 15 mins)
      shuffle INTEGER NOT NULL DEFAULT 1, -- Shuffle flag (1 = True, 0 = False)
      enabled INTEGER NOT NULL DEFAULT 1, -- Active status (1 = Active, 0 = Inactive)

      notification_id TEXT,          -- Registered system notification identifier

      created_at INTEGER NOT NULL,   -- Timestamp when created
      updated_at INTEGER,            -- Timestamp when modified
      sync_status TEXT NOT NULL DEFAULT 'pending_create' -- Offline sync status (e.g. pending save to backend)
    );
  `);
}
