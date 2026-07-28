// validation.ts
// Pure, framework-free validation helpers shared by all auth forms.
// Kept separate so rules aren't duplicated between Login/Register/ForgotPassword.

import {
  EMAIL_PATTERN,
  PASSWORD_MIN_LENGTH,
  USERNAME_PATTERN,
} from './constants';
import { ValidationResult } from './types';

export function validateUsername(username: string): ValidationResult {
  if (!username.trim()) {
    return { valid: false, message: 'Username cannot be empty' };
  }
  if (!USERNAME_PATTERN.test(username.trim())) {
    return {
      valid: false,
      message: '3-20 characters, letters, numbers, "." or "_" only',
    };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, message: 'Email cannot be empty' };
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return { valid: false, message: 'Invalid email address' };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: 'Password cannot be empty' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must contain at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must include a letter and a number' };
  }
  return { valid: true };
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true };
}

export function passwordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}
