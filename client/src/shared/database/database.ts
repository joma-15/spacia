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
      user_id TEXT NOT NULL,         -- Owner of this cached row
      subject TEXT NOT NULL,         -- The name of the subject
      accent_color TEXT NOT NULL,    -- Color code used in the UI theme
      sync_status TEXT NOT NULL DEFAULT 'synced'
    );

    -- 2. Flashcards Table: Stores individual study cards
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,           -- Unique identifier for the card
      user_id TEXT NOT NULL,         -- Owner of this cached row
      folder_id TEXT NOT NULL,       -- Links card to its parent folder (foreign key)
      question TEXT NOT NULL,        -- The question/front text
      answer TEXT NOT NULL,          -- The answer/back text
      status TEXT CHECK (status IN ('review', 'understood')), -- Status check (only allow review or understood)
      sync_status TEXT NOT NULL DEFAULT 'synced',
      FOREIGN KEY (folder_id) REFERENCES folders(id) -- Connects to folders table
    );

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

  // Run migrations to add sync_status to existing tables
  try {
    db.execSync("ALTER TABLE folders ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced';");
  } catch (e) {
    // Column already exists or table doesn't exist yet
  }

  try {
    db.execSync("ALTER TABLE flashcards ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced';");
  } catch (e) {
    // Column already exists
  }

  // Caches created before ownership was introduced cannot be attributed safely.
  // Delete only those legacy rows; correctly scoped caches remain available offline.
  for (const table of ["folders", "flashcards"]) {
    try {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN user_id TEXT;`);
    } catch {
      // Fresh databases already include the column; existing installs may
      // already have completed this one-time migration.
    }
    db.execSync(`DELETE FROM ${table} WHERE user_id IS NULL;`);
  }

  // These must run after the migration. SQLite validates indexed columns when
  // creating an index, so creating these before adding user_id breaks upgrades.
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_flashcards_folder ON flashcards(folder_id);
    CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
    CREATE INDEX IF NOT EXISTS idx_flashcards_user_folder ON flashcards(user_id, folder_id);
  `);
}

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Run database initialization synchronously on module import to prevent race conditions with screen mounts
initializeDatabase();
