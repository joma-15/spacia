import { readResource, writeResource } from "@/shared/database/resourceCacheRepository";

export type FetchPolicy = "cache-first" | "network-first" | "stale-while-revalidate" | "network-only";
type Entry<T> = { data: T; updatedAt: number };
const memory = new Map<string, Entry<unknown>>();
const syncPromises = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<() => void>>();

const fullKey = (userId: string, resource: string) => `${userId}:${resource}`;
const emit = (key: string) => listeners.get(key)?.forEach((listener) => listener());

export function subscribeResource(userId: string, resource: string, listener: () => void) {
  const key = fullKey(userId, resource);
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(listener); listeners.set(key, set);
  return () => { set.delete(listener); };
}

export function invalidateResource(userId: string, resource: string) {
  const key = fullKey(userId, resource);
  memory.delete(key);
  emit(key);
}
export function setResourceMemory<T>(userId: string, resource: string, data: T, updatedAt = Date.now()) {
  const key = fullKey(userId, resource);
  memory.set(key, { data, updatedAt });
  emit(key);
}
export function clearMemoryForUser(userId: string) {
  for (const key of memory.keys()) if (key.startsWith(`${userId}:`)) memory.delete(key);
}

interface Options<T> {
  userId: string; resource: string; staleTime: number; policy?: FetchPolicy;
  readLocal: () => Entry<T> | null; writeLocal: (data: T, updatedAt: number) => void;
  fetchRemote: () => Promise<T>;
}

export async function loadResource<T>(options: Options<T>): Promise<T> {
  const key = fullKey(options.userId, options.resource);
  const policy = options.policy ?? "stale-while-revalidate";
  const cached = memory.get(key) as Entry<T> | undefined;
  const local = cached ?? options.readLocal();
  if (local) memory.set(key, local);
  const stale = !local || Date.now() - local.updatedAt >= options.staleTime;
  const sync = () => synchronize(options, key);

  if (policy === "network-only" || policy === "network-first" || !local) return sync();
  console.log(`[API] ${options.resource} [CACHE] ${cached ? "HIT" : "MISS"} [DB] HIT [NETWORK] ${stale && policy === "stale-while-revalidate" ? "SYNC" : "SKIPPED"}`);
  if (stale && policy === "stale-while-revalidate") void sync().catch(() => undefined);
  return local.data;
}

async function synchronize<T>(options: Options<T>, key: string): Promise<T> {
  const existing = syncPromises.get(key) as Promise<T> | undefined;
  if (existing) { console.log(`[API] ${options.resource} [DEDUP] Existing sync found`); return existing; }
  const started = Date.now();
  const sync = options.fetchRemote().then((data) => {
    const entry = { data, updatedAt: Date.now() };
    memory.set(key, entry); options.writeLocal(data, entry.updatedAt); emit(key);
    console.log(`[API] ${options.resource} [CACHE] UPDATED [DB] WRITE [NETWORK] SYNC [DURATION] ${Date.now() - started}ms`);
    return data;
  }).finally(() => syncPromises.delete(key));
  syncPromises.set(key, sync);
  return sync;
}

export const genericResourceCache = { read: readResource, write: writeResource };
