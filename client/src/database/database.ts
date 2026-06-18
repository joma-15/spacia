// src/database/database.ts

import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("spacia.db");

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

      status TEXT CHECK (
        status IN ('review', 'understood')
      ),

      FOREIGN KEY(folder_id) REFERENCES folders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_flashcards_folder
    ON flashcards(folder_id);
  `);
}