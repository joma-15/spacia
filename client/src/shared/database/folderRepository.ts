import { db } from "./database";

/**
 * Saves a list of subject folders into the local database cache.
 * Uses "INSERT OR REPLACE" to update existing folders or create new ones 
 * without causing primary key constraint conflicts.
 */
export function saveFolders(folders: any[]) {
  for (const folder of folders) {
    db.runSync(
      `
      INSERT OR REPLACE INTO folders
      (
        id,
        subject,
        accent_color
      )
      VALUES (?, ?, ?)
      `,
      [
        folder.id,
        folder.subject,
        folder.accentColor
      ]
    );
  }
}

/**
 * Returns all subject folders saved in the local database.
 */
export function getFolders() {
  return db.getAllSync(`
    SELECT *
    FROM folders
  `);
}

/**
 * Deletes a subject folder from local database by its ID.
 */
export function deleteFolder(
  folderId: string
) {
  db.runSync(
    `
    DELETE FROM folders
    WHERE id = ?
    `,
    [folderId]
  );
}