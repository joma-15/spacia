import { db } from "./database";

/**
 * Saves a list of subject folders into the local database cache.
 * Uses "INSERT OR REPLACE" to update existing folders or create new ones 
 * without causing primary key constraint conflicts.
 */
export function saveFolders(folders: any[], syncStatus: string = 'synced') {
  for (const folder of folders) {
    db.runSync(
      `
      INSERT OR REPLACE INTO folders
      (
        id,
        subject,
        accent_color,
        sync_status
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        folder.id,
        folder.subject,
        folder.accentColor || folder.accent_color,
        syncStatus
      ]
    );
  }
}

/**
 * Returns all active subject folders saved in the local database (excluding pending deletes).
 */
export function getFolders() {
  return db.getAllSync(`
    SELECT *
    FROM folders
    WHERE sync_status != 'pending_delete'
  `);
}

/**
 * Returns all folders matching a specific sync status (e.g. 'pending_create' or 'pending_delete').
 */
export function getFoldersBySyncStatus(status: string) {
  return db.getAllSync(`
    SELECT *
    FROM folders
    WHERE sync_status = ?
  `, [status]);
}

/**
 * Updates the subject name of a folder in the local database.
 * Marks the folder as 'pending_update' so the background sync will push the change to the server.
 */
export function updateFolder(folderId: string, newSubject: string) {
  db.runSync(
    `UPDATE folders SET subject = ?, sync_status = 'pending_update' WHERE id = ?`,
    [newSubject, folderId]
  );
}

/**
 * Deletes a subject folder from local database by its ID.
 * If it is pending creation, we delete it directly. Otherwise, we flag it as pending delete.
 */
export function deleteFolder(folderId: string) {
  const row = db.getFirstSync(`SELECT sync_status FROM folders WHERE id = ?`, [folderId]) as any;
  if (row && row.sync_status === 'pending_create') {
    db.runSync(
      `
      DELETE FROM folders
      WHERE id = ?
      `,
      [folderId]
    );
  } else {
    db.runSync(
      `
      UPDATE folders
      SET sync_status = 'pending_delete'
      WHERE id = ?
      `,
      [folderId]
    );
  }
}