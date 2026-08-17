import { db } from "./database";

/**
 * Saves a list of flashcards into the local offline SQLite database.
 * Uses "INSERT OR REPLACE" (often called "upsert") which creates a new row 
 * or updates the existing one if the card ID already exists. 
 * This prevents duplicate ID errors when syncing new changes from the backend server.
 */
export function saveFlashcards(userId: string, cards: any[], syncStatus: string = 'synced') {
  for (const card of cards) {
    db.runSync(
      `
      INSERT OR REPLACE INTO flashcards
      (
        id,
        user_id,
        folder_id,
        question,
        answer,
        status,
        sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        card.id,
        userId,
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
export function replaceFlashcardsForFolder(userId: string, folderId: string, cards: any[], syncStatus: string = 'synced') {
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE user_id = ? AND folder_id = ? AND sync_status = 'synced'
    `,
    [userId, folderId],
  );

  saveFlashcards(userId, cards, syncStatus);
}

/**
 * Reads all active flashcards saved in a specific folder from local SQLite (excluding pending deletes).
 */
export function getFlashcardsByFolder(userId: string, folderId: string) {
  return db.getAllSync(
    `
    SELECT *
    FROM flashcards
    WHERE user_id = ? AND folder_id = ? AND sync_status != 'pending_delete'
    `,
    [userId, folderId]
  );
}

/**
 * Returns all flashcards matching a specific sync status (e.g. 'pending_create' or 'pending_delete').
 */
export function getFlashcardsBySyncStatus(userId: string, status: string) {
  return db.getAllSync(`
    SELECT *
    FROM flashcards
    WHERE user_id = ? AND sync_status = ?
  `, [userId, status]);
}


/**
 * Deletes all local flashcards in a folder immediately.
 */
export function deleteAllFlashcardsForFolder(userId: string, folderId: string) {
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE user_id = ? AND folder_id = ?
    `,
    [userId, folderId],
  );
}

/**
 * Removes a single card from local SQLite database cache.
 * If it is pending creation, we delete it directly. Otherwise, we flag it as pending delete.
 */
export function deleteFlashcard(userId: string, cardId: string) {
  const row = db.getFirstSync(`SELECT sync_status FROM flashcards WHERE id = ? AND user_id = ?`, [cardId, userId]) as any;
  if (row && row.sync_status === 'pending_create') {
    db.runSync(
      `
      DELETE FROM flashcards
      WHERE id = ? AND user_id = ?
      `,
      [cardId, userId]
    );
  } else {
    db.runSync(
      `
      UPDATE flashcards
      SET sync_status = 'pending_delete'
      WHERE id = ? AND user_id = ?
      `,
      [cardId, userId]
    );
  }
}

/**
 * Updates the study status ('review' or 'understood') of a card locally.
 */
export function updateFlashcardStatus(
  userId: string,
  id: string,
  status: string
) {
  db.runSync(
    `
    UPDATE flashcards
    SET status = ?
    WHERE id = ? AND user_id = ?
    `,
    [status, id, userId]
  );
}

/**
 * Returns a map of { [folderId]: cardCount } for every folder,
 * counting only cards that are NOT pending deletion.
 * Uses a single GROUP BY query — O(1) regardless of folder count.
 */
export function getCardCountsPerFolder(userId: string): Record<string, number> {
  const rows = db.getAllSync(`
    SELECT folder_id, COUNT(*) AS count
    FROM flashcards
    WHERE user_id = ? AND sync_status != 'pending_delete'
    GROUP BY folder_id
  `, [userId]) as { folder_id: string; count: number }[];

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.folder_id] = row.count;
  }
  return map;
}

/** Returns active flashcard totals by learning status for dashboard folder cards. */
export function getCardStatsPerFolder(userId: string): Record<string, {
  totalCards: number;
  reviewCards: number;
  understoodCards: number;
}> {
  const rows = db.getAllSync(`
    SELECT folder_id, COUNT(*) AS total_cards,
      SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review_cards,
      SUM(CASE WHEN status = 'understood' THEN 1 ELSE 0 END) AS understood_cards
    FROM flashcards
    WHERE user_id = ? AND sync_status != 'pending_delete'
    GROUP BY folder_id
  `, [userId]) as {
    folder_id: string;
    total_cards: number;
    review_cards: number;
    understood_cards: number;
  }[];

  const stats: Record<string, {
    totalCards: number;
    reviewCards: number;
    understoodCards: number;
  }> = {};
  for (const row of rows) {
    stats[row.folder_id] = {
      totalCards: row.total_cards,
      reviewCards: row.review_cards,
      understoodCards: row.understood_cards,
    };
  }
  return stats;
}
