import { BASE_URL } from '../../shared/config/api';
// constants.ts
// Action limits, timeouts, storage keys, and API config for streak-auth.


// --- Backend ---
export const API_BASE_URL = `${BASE_URL}`; // TODO: point at real backend
export const USE_BACKEND = true; // TODO: flip to false once API_BASE_URL is live
export const MOCK_NETWORK_DELAY_MS = 650;

// --- Storage keys ---
export const SESSION_STORAGE_KEY = '@streak_auth/session';
export const GUEST_CACHE_OWNER_STORAGE_KEY = '@spacia/guest_cache_owner';
export const MOCK_USERS_STORAGE_KEY = '@streak_auth/mock_users';

// --- Validation rules ---
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;

// --- UI timing ---
export const MODAL_ANIM_DURATION_MS = 260;
