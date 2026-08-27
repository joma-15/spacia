import { getFolders, reconcileFoldersFromServer } from "@/shared/database/folderRepository";
import { getCardCountsPerFolder } from "@/shared/database/flashcardRepository";
import { readResource, writeResource } from "@/shared/database/resourceCacheRepository";
import { authenticatedFetch } from "./authenticatedFetch";
import { FetchPolicy, loadResource, setResourceMemory } from "./resourceStore";

export interface CachedFolder { id: string; subject: string; accentColor: string; cardCount: number }
const RESOURCE = "folders";
const STALE_TIME = 5 * 60 * 1000;

function localFolders(userId: string): CachedFolder[] {
  const cachedResource = readResource<CachedFolder[]>(userId, RESOURCE);
  const cachedCountMap = new Map((cachedResource?.data ?? []).map((f) => [f.id, f.cardCount]));
  const counts = getCardCountsPerFolder(userId);
  return (getFolders(userId) as any[]).map((folder) => {
    const id = String(folder.id);
    const localDbCount = counts[id];
    const cachedCount = cachedCountMap.get(id);
    // Use local SQLite count if flashcards have been loaded, or last known cached count
    const cardCount = (localDbCount !== undefined && localDbCount > 0)
      ? localDbCount
      : (cachedCount ?? 0);
    return {
      id,
      subject: folder.subject,
      accentColor: folder.accent_color ?? folder.accentColor ?? "#6B7280",
      cardCount,
    };
  });
}

export async function loadFolders(userId: string, policy: FetchPolicy = "stale-while-revalidate"): Promise<CachedFolder[]> {
  return loadResource({
    userId, resource: RESOURCE, staleTime: STALE_TIME, policy,
    readLocal: () => {
      const cached = readResource<CachedFolder[]>(userId, RESOURCE);
      if (cached && cached.data.length > 0) return cached;
      const folders = localFolders(userId);
      return folders.length ? { data: folders, updatedAt: 0 } : null;
    },
    writeLocal: (folders, updatedAt) => {
      reconcileFoldersFromServer(userId, folders);
      writeResource(userId, RESOURCE, folders, updatedAt);
    },
    fetchRemote: async () => {
      const response = await authenticatedFetch("/folders");
      const body = await response.json() as { response?: any[] };
      return (body.response ?? []).map((folder) => ({
        id: String(folder.id), subject: folder.subject,
        accentColor: folder.accentColor ?? folder.accent_color ?? "#6B7280", cardCount: folder.cardCount ?? 0,
      }));
    },
  });
}

export function getCachedFolders(userId: string) {
  const cached = readResource<CachedFolder[]>(userId, RESOURCE);
  if (cached && cached.data.length > 0) return cached.data;
  return localFolders(userId);
}

export function recordFolderMutation(userId: string) {
  // Folder mutations already update the relational cache. Mark its list stale
  // without evicting it, so navigation remains instant and the next allowed
  // sync reconciles server state.
  const folders = localFolders(userId);
  const updatedAt = Date.now();
  writeResource(userId, RESOURCE, folders, updatedAt);
  setResourceMemory(userId, RESOURCE, folders, updatedAt);
}
