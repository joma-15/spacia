import { db } from "./database";

export function saveFlashcards(cards: any[]) {
  /** Upsert lets the cache accept new server data without duplicate primary keys. */
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

/** Make the local cache for one folder match the server exactly. */
export function replaceFlashcardsForFolder(folderId: string, cards: any[]) {
  /**
   * A server refresh is authoritative. Delete first so local rows removed on
   * another device cannot briefly reappear in this folder's count or list.
   */
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE folder_id = ?
    `,
    [folderId],
  );

  saveFlashcards(cards);
}

export function getFlashcardsByFolder(
  folderId: string
) {
  /** Read-only offline fallback used when the server refresh cannot complete. */
  return db.getAllSync(
    `
    SELECT *
    FROM flashcards
    WHERE folder_id = ?
    `,
    [folderId]
  );
}

export function deleteFlashcard(
  cardId: string
) {
  /** Keep the local cache in sync after a successful server deletion. */
  db.runSync(
    `
    DELETE FROM flashcards
    WHERE id = ?
    `,
    [cardId]
  );
}

export function updateFlashcardStatus(
  id: string,
  status: string
) {
  /** Persist the status only after the backend accepted the same change. */
  db.runSync(
    `
    UPDATE flashcards
    SET status = ?
    WHERE id = ?
    `,
    [status, id]
  );
}
