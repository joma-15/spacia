import { db } from "./database";

export interface CachedResource<T> { data: T; updatedAt: number }

export function readResource<T>(userId: string, key: string): CachedResource<T> | null {
  const row = db.getFirstSync(
    "SELECT payload, updated_at FROM resource_cache WHERE user_id = ? AND resource_key = ?",
    [userId, key],
  ) as { payload: string; updated_at: number } | null;
  if (!row) return null;
  try { return { data: JSON.parse(row.payload) as T, updatedAt: row.updated_at }; } catch { return null; }
}

export function writeResource<T>(userId: string, key: string, data: T, updatedAt = Date.now()) {
  db.runSync(
    "INSERT OR REPLACE INTO resource_cache (user_id, resource_key, payload, updated_at) VALUES (?, ?, ?, ?)",
    [userId, key, JSON.stringify(data), updatedAt],
  );
}

export function removeUserResources(userId: string) {
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM resource_cache WHERE user_id = ?", [userId]);
    db.runSync("DELETE FROM flashcards WHERE user_id = ?", [userId]);
    db.runSync("DELETE FROM folders WHERE user_id = ?", [userId]);
  });
}
