import { db } from "./database";

/**
 * Saves a list of flashcards into the local offline SQLite database.
 * Uses "INSERT OR REPLACE" (often called "upsert") which creates a new row 
 * or updates the existing one if the card ID already exists. 
 * This prevents duplicate ID errors when syncing new changes from the backend server.
 */
export function saveFlashcards(cards: any[], syncStatus: string = 'synced') {
  for (const card of cards) {
    db.runSync(
      `
      INSERT OR REPLACE INTO flashcards
      (
        id,
        folder_id,
        question,
        answer,
        status,
        sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        card.id,
        card.folderId || card.folder_id,
        card.question,
        card.answer,
        card.status,
        syncStatus
      ]
    );
  }
}

/**
 * Replaces all local flashcards in a folder with a fresh list from the server.
 * This only deletes synced cards, preserving any pending offline-created cards!
 */
export function replaceFlashcardsForFolder(folderId: string, cards: any[], syncStatus: string = 'synced') {
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE folder_id = ? AND sync_status = 'synced'
    `,
    [folderId],
  );

  saveFlashcards(cards, syncStatus);
}

/**
 * Reads all active flashcards saved in a specific folder from local SQLite (excluding pending deletes).
 */
export function getFlashcardsByFolder(folderId: string) {
  return db.getAllSync(
    `
    SELECT *
    FROM flashcards
    WHERE folder_id = ? AND sync_status != 'pending_delete'
    `,
    [folderId]
  );
}

/**
 * Returns all flashcards matching a specific sync status (e.g. 'pending_create' or 'pending_delete').
 */
export function getFlashcardsBySyncStatus(status: string) {
  return db.getAllSync(`
    SELECT *
    FROM flashcards
    WHERE sync_status = ?
  `, [status]);
}


/**
 * Deletes all local flashcards in a folder immediately.
 */
export function deleteAllFlashcardsForFolder(folderId: string) {
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE folder_id = ?
    `,
    [folderId],
  );
}

/**
 * Removes a single card from local SQLite database cache.
 * If it is pending creation, we delete it directly. Otherwise, we flag it as pending delete.
 */
export function deleteFlashcard(cardId: string) {
  const row = db.getFirstSync(`SELECT sync_status FROM flashcards WHERE id = ?`, [cardId]) as any;
  if (row && row.sync_status === 'pending_create') {
    db.runSync(
      `
      DELETE FROM flashcards
      WHERE id = ?
      `,
      [cardId]
    );
  } else {
    db.runSync(
      `
      UPDATE flashcards
      SET sync_status = 'pending_delete'
      WHERE id = ?
      `,
      [cardId]
    );
  }
}

/**
 * Updates the study status ('review' or 'understood') of a card locally.
 */
export function updateFlashcardStatus(
  id: string,
  status: string
) {
  db.runSync(
    `
    UPDATE flashcards
    SET status = ?
    WHERE id = ?
    `,
    [status, id]
  );
}

/**
 * Returns a map of { [folderId]: cardCount } for every folder,
 * counting only cards that are NOT pending deletion.
 * Uses a single GROUP BY query — O(1) regardless of folder count.
 */
export function getCardCountsPerFolder(): Record<string, number> {
  const rows = db.getAllSync(`
    SELECT folder_id, COUNT(*) AS count
    FROM flashcards
    WHERE sync_status != 'pending_delete'
    GROUP BY folder_id
  `) as { folder_id: string; count: number }[];

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.folder_id] = row.count;
  }
  return map;
}
