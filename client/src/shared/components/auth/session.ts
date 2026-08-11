import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_STORAGE_KEY } from '@/features/auth/constants';
import type { StoredSession } from '@/features/auth/types';

type SessionClearedListener = () => void;
const sessionClearedListeners = new Set<SessionClearedListener>();

export async function getAccessToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) return null;

  try {
    const session: StoredSession = JSON.parse(raw);
    return session.token ?? null;
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session: StoredSession = JSON.parse(raw);
    return session.refreshToken ?? null;
  } catch {
    return null;
  }
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return;

  try {
    const session: StoredSession = JSON.parse(raw);
    session.token = accessToken;
    session.refreshToken = refreshToken;
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    await clearTokens();
  }
}

export async function updateAccessToken(accessToken: string): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) await saveTokens(accessToken, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  sessionClearedListeners.forEach((listener) => listener());
}

export function subscribeToSessionCleared(listener: SessionClearedListener): () => void {
  sessionClearedListeners.add(listener);
  return () => sessionClearedListeners.delete(listener);
}
