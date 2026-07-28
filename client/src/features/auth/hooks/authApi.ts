// hooks/authApi.ts
// All network/API concerns for authentication live here. Nothing in this
// file knows about React — it's a plain async API that useAuth.ts calls.
//
// Point API_BASE_URL (in constants.ts) at your real backend when it's ready.
// Until then, USE_MOCK_BACKEND=true routes every call through a small
// in-memory mock (backed by AsyncStorage) so the whole flow — including
// "email already exists" and "username already exists" — works end-to-end
// with no server.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  MOCK_NETWORK_DELAY_MS,
  MOCK_USERS_STORAGE_KEY,
  USE_MOCK_BACKEND,
} from '../constants';
import { AuthResponse, LoginPayload, RegisterPayload } from '../types';

export class AuthError extends Error {
  code: string;
  field?: 'username' | 'email' | 'password' | 'confirmPassword' | 'general';

  constructor(message: string, code: string, field?: AuthError['field']) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK_BACKEND) return mockLogin(payload);
  return request<AuthResponse>('/auth/login', payload);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  if (USE_MOCK_BACKEND) return mockRegister(payload);
  return request<AuthResponse>('/auth/register', payload);
}

export async function requestPasswordReset(email: string): Promise<{ success: true }> {
  if (USE_MOCK_BACKEND) return mockRequestPasswordReset(email);
  return request<{ success: true }>('/auth/forgot-password', { email });
}

// ---------------------------------------------------------------------------
// Real network layer
// ---------------------------------------------------------------------------

async function request<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError(
      "Can't reach the server. Check your connection and try again.",
      'network_error'
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response — fall through to status-based handling below.
  }

  if (!response.ok) {
    throw mapServerError(response.status, data);
  }

  return data as T;
}

function mapServerError(status: number, data: any): AuthError {
  const code = data?.code ?? 'unknown_error';
  const message = data?.message;

  switch (code) {
    case 'invalid_credentials':
      return new AuthError('Incorrect username or password', code, 'general');
    case 'username_taken':
      return new AuthError('Username already exists', code, 'username');
    case 'email_taken':
      return new AuthError('An account with this email already exists', code, 'email');
    case 'weak_password':
      return new AuthError('Password must contain at least 8 characters', code, 'password');
    default:
      if (status >= 500) {
        return new AuthError(
          "Something went wrong on our end. Please try again shortly.",
          'server_error'
        );
      }
      return new AuthError(message || 'Something went wrong. Please try again.', code, 'general');
  }
}

// ---------------------------------------------------------------------------
// Mock backend (AsyncStorage-backed) — remove once a real API is connected
// ---------------------------------------------------------------------------

interface MockUserRecord {
  id: string;
  username: string;
  email: string;
  password: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readMockDb(): Promise<MockUserRecord[]> {
  const raw = await AsyncStorage.getItem(MOCK_USERS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeMockDb(users: MockUserRecord[]): Promise<void> {
  await AsyncStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
}

function fakeToken(userId: string) {
  return `mock.${userId}.${Date.now()}`;
}

async function mockLogin({ identifier, password }: LoginPayload): Promise<AuthResponse> {
  await delay(MOCK_NETWORK_DELAY_MS);

  const users = await readMockDb();
  const match = users.find(
    (u) =>
      (u.username.toLowerCase() === identifier.trim().toLowerCase() ||
        u.email.toLowerCase() === identifier.trim().toLowerCase()) &&
      u.password === password
  );

  if (!match) {
    throw new AuthError('Incorrect username or password', 'invalid_credentials', 'general');
  }

  return {
    token: fakeToken(match.id),
    user: { id: match.id, username: match.username, email: match.email },
  };
}

async function mockRegister({ username, email, password }: RegisterPayload): Promise<AuthResponse> {
  await delay(MOCK_NETWORK_DELAY_MS);

  const users = await readMockDb();

  if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
    throw new AuthError('Username already exists', 'username_taken', 'username');
  }
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new AuthError('An account with this email already exists', 'email_taken', 'email');
  }

  const newUser: MockUserRecord = {
    id: `u_${Date.now()}`,
    username: username.trim(),
    email: email.trim(),
    password,
  };

  await writeMockDb([...users, newUser]);

  return {
    token: fakeToken(newUser.id),
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  };
}

async function mockRequestPasswordReset(_email: string): Promise<{ success: true }> {
  await delay(MOCK_NETWORK_DELAY_MS);
  // Intentionally always succeeds — never reveal whether the email exists.
  return { success: true };
}
