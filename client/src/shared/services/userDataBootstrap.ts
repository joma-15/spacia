import { clearMemoryForUser } from "./resourceStore";
import { loadFolders } from "./folderDataService";

const initializations = new Map<string, Promise<void>>();

/** One owner for post-auth startup work. Screens remain lazy; only the folder
 * index is warmed because it is used by both Library and dashboard. */
export function initializeUserData(userId: string): Promise<void> {
  const existing = initializations.get(userId);
  if (existing) return existing;
  const work = loadFolders(userId, "network-first")
    .then(() => undefined)
    // A first launch is still allowed to reach the UI if offline. The screen
    // will surface an error only when it has no local data to show.
    .catch((error) => console.warn("Initial user-data sync deferred:", error))
    .finally(() => initializations.delete(userId));
  initializations.set(userId, work);
  return work;
}

export function clearUserDataMemory(userId: string) { clearMemoryForUser(userId); }
