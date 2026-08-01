// hooks/useAuth.ts
// Central business hook for streak-auth (mirrors the role of useFlashCards.ts:
// state, session persistence, and mutations all live here). Wrap the app
// (or at minimum the Streak tab) in <AuthProvider> once, then call useAuth()
// anywhere below it.

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SESSION_STORAGE_KEY } from "../constants";
import { AuthResponse, AuthUser, StoredSession } from "../types";
import * as authApi from "./authApi";
import { AuthError } from "./authApi";
import { BASE_URL } from "@/shared/config/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean; // true while checking for a persisted session on boot
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- Session persistence (AsyncStorage) ---------------------------------
// Kept in this file rather than a separate service, matching how session
// concerns for a feature live alongside its business hook.

async function saveSession(session: StoredSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

async function loadSession(): Promise<StoredSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: StoredSession = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await clearSession();
      return null;
    }
    return parsed;
  } catch {
    // Corrupted entry — treat as logged out rather than crashing the app.
    await clearSession();
    return null;
  }
}

async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

// --- Provider -------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore a persisted session on app launch so the user isn't logged out
  // just because they closed/restarted the app.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await loadSession();
      if (!cancelled && session) {
        setUser(session.user);
      }
      if (!cancelled) {
        setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistAndSetUser = useCallback(async (response: AuthResponse) => {
    const session: StoredSession = {
      token: response.access_token,
      user: response.user,
    };
    await saveSession(session);
    setUser(response.user);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await authApi.login({ identifier, password });
      await persistAndSetUser(response);
    },
    [persistAndSetUser],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const response = await authApi.register({ username, email, password });
      await persistAndSetUser(response);
    },
    [persistAndSetUser],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await authApi.requestPasswordReset(email);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isRestoring,
      login,
      register,
      requestPasswordReset,
      logout,
    }),
    [user, isRestoring, login, register, requestPasswordReset, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}

export { AuthError };
