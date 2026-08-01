import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_STORAGE_KEY } from '@/features/auth/constants';

export async function getAccessToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    return session.token ?? null;
  } catch {
    return null;
  }
}