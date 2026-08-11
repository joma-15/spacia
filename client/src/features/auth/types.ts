// types.ts
// Shared TypeScript types for the streak-auth feature.

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export type AuthMode = 'login' | 'register' | 'forgotPassword';

export interface LoginPayload {
  identifier: string; // username or email
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface StoredSession {
  token: string;
  refreshToken?: string;
  user: AuthUser;
  expiresAt?: number; // epoch ms, optional
}

export type AuthErrorField =
  | 'username'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'general';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export type LoginFieldErrors = Partial<
  Record<'identifier' | 'password' | 'general', string>
>;

export type RegisterFieldErrors = Partial<
  Record<'username' | 'email' | 'password' | 'confirmPassword' | 'general', string>
>;
