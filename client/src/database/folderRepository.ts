import { db } from "./database";

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

export function getFolders() {
  return db.getAllSync(`
    SELECT *
    FROM folders
  `);
}

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