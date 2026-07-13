import { db } from "./database";

/**
 * Saves a list of flashcards into the local offline SQLite database.
 * Uses "INSERT OR REPLACE" (often called "upsert") which creates a new row 
 * or updates the existing one if the card ID already exists. 
 * This prevents duplicate ID errors when syncing new changes from the backend server.
 */
export function saveFlashcards(cards: any[]) {
  for (const card of cards) {
    db.runSync(
      `
      INSERT OR REPLACE INTO flashcards
      (
        id,
        folder_id,
        question,
        answer,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        card.id,
        card.folderId,
        card.question,
        card.answer,
        card.status
      ]
    );
  }
}

/**
 * Replaces all local flashcards in a folder with a fresh list from the server.
 * This is used to make sure our local database matches the server exactly:
 * 1. Deletes all local flashcards for this folder.
 * 2. Saves the new list of cards.
 * Doing a delete first ensures that any cards we deleted on other devices do not 
 * keep showing up locally.
 */
export function replaceFlashcardsForFolder(folderId: string, cards: any[]) {
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE folder_id = ?
    `,
    [folderId],
  );

  saveFlashcards(cards);
}

/**
 * Reads all flashcards saved in a specific folder from local SQLite.
 * This acts as a fast offline read fallback when the user has no internet.
 */
export function getFlashcardsByFolder(
  folderId: string
) {
  return db.getAllSync(
    `
    SELECT *
    FROM flashcards
    WHERE folder_id = ?
    `,
    [folderId]
  );
}

/**
 * Removes a single card from local SQLite database cache.
 */
export function deleteFlashcard(
  cardId: string
) {
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE id = ?
    `,
    [cardId]
  );
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
