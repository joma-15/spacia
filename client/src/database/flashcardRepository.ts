import { db } from "./database";

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