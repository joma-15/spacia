import { db } from "./database";

/**
 * Saves a list of subject folders into the local database cache.
 * Uses "INSERT OR REPLACE" to update existing folders or create new ones 
 * without causing primary key constraint conflicts.
 */
export function saveFolders(userId: string, folders: any[], syncStatus: string = 'synced') {
  for (const folder of folders) {
    db.runSync(
      `
      INSERT OR REPLACE INTO folders
      (
        id,
        user_id,
        subject,
        accent_color,
        sync_status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        folder.id,
        userId,
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
export function getFolders(userId: string) {
  return db.getAllSync(`
    SELECT *
    FROM folders
    WHERE user_id = ? AND sync_status != 'pending_delete'
  `, [userId]);
}

/**
 * Returns all folders matching a specific sync status (e.g. 'pending_create' or 'pending_delete').
 */
export function getFoldersBySyncStatus(userId: string, status: string) {
  return db.getAllSync(`
    SELECT *
    FROM folders
    WHERE user_id = ? AND sync_status = ?
  `, [userId, status]);
}

/**
 * Updates the subject name of a folder in the local database.
 * Marks the folder as 'pending_update' so the background sync will push the change to the server.
 */
export function updateFolder(userId: string, folderId: string, newSubject: string) {
  db.runSync(
    `UPDATE folders SET subject = ?, sync_status = 'pending_update' WHERE id = ? AND user_id = ?`,
    [newSubject, folderId, userId]
  );
}

/**
 * Deletes a subject folder from local database by its ID.
 * If it is pending creation, we delete it directly. Otherwise, we flag it as pending delete.
 */
export function deleteFolder(userId: string, folderId: string) {
  const row = db.getFirstSync(`SELECT sync_status FROM folders WHERE id = ? AND user_id = ?`, [folderId, userId]) as any;
  if (row && row.sync_status === 'pending_create') {
    db.runSync(
      `
      DELETE FROM folders
      WHERE id = ? AND user_id = ?
      `,
      [folderId, userId]
    );
  } else {
    db.runSync(
      `
      UPDATE folders
      SET sync_status = 'pending_delete'
      WHERE id = ? AND user_id = ?
      `,
      [folderId, userId]
    );
  }
}

/** Returns all cached rows, including intentionally hidden pending deletions. */
export function getAllFolders(userId: string) {
  return db.getAllSync("SELECT * FROM folders WHERE user_id = ?", [userId]);
}

/**
 * Reconciles a successful GET /folders snapshot without overwriting a local
 * mutation that still needs to be sent.  In particular, a pending deletion is
 * not turned back into a synced row simply because the server still returned
 * it in a snapshot taken before the delete was sent.
 */
export function reconcileFoldersFromServer(userId: string, folders: any[]) {
  db.withTransactionSync(() => {
    for (const folder of folders) {
      const existing = db.getFirstSync(
        "SELECT sync_status FROM folders WHERE id = ? AND user_id = ?",
        [folder.id, userId],
      ) as { sync_status: string } | null;

      if (existing?.sync_status === "pending_delete" || existing?.sync_status === "pending_update") {
        continue;
      }

      saveFolders(userId, [folder], "synced");
    }

    const remoteIds = folders.map((folder) => folder.id);
    if (remoteIds.length === 0) {
      db.runSync("DELETE FROM folders WHERE user_id = ? AND sync_status = 'synced'", [userId]);
      return;
    }

    const placeholders = remoteIds.map(() => "?").join(", ");
    db.runSync(
      `DELETE FROM folders
       WHERE user_id = ? AND sync_status IN ('synced', 'pending_delete') AND id NOT IN (${placeholders})`,
      [userId, ...remoteIds],
    );
  });
}
