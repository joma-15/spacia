import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth, AuthError } from '../hooks/useAuth';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../validation';
import { colors, spacing, typography } from '../styles/styles';
import { RegisterFieldErrors } from '../types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterForm({ onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const { register } = useAuth();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof RegisterFieldErrors) => {
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const runClientValidation = (): RegisterFieldErrors => {
    const next: RegisterFieldErrors = {};

    const u = validateUsername(username);
    if (!u.valid) next.username = u.message;

    const em = validateEmail(email);
    if (!em.valid) next.email = em.message;

    const pw = validatePassword(password);
    if (!pw.valid) next.password = pw.message;

    const cpw = validateConfirmPassword(password, confirmPassword);
    if (!cpw.valid) next.confirmPassword = cpw.message;

    return next;
  };

  const handleSubmit = async () => {
    const clientErrors = runClientValidation();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      onSuccess();
    } catch (err) {
      if (err instanceof AuthError) {
        const field = (err.field && err.field !== 'general' ? err.field : 'general') as keyof RegisterFieldErrors;
        setErrors({ [field]: err.message } as RegisterFieldErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>Sync your streaks and never lose your progress.</Text>

      {!!errors.general && (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      )}

      <AuthInput
        label="Username"
        placeholder="Choose a username"
        value={username}
        onChangeText={(t) => {
          setUsername(t);
          clearError('username');
        }}
        error={errors.username}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        editable={!submitting}
      />

      <AuthInput
        ref={emailRef}
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError('email');
        }}
        error={errors.email}
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!submitting}
      />

      <AuthInput
        ref={passwordRef}
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError('password');
        }}
        error={errors.password}
        isPassword
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!submitting}
      />

      <AuthInput
        ref={confirmRef}
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          clearError('confirmPassword');
        }}
        error={errors.confirmPassword}
        isPassword
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!submitting}
      />

      <AuthButton
        title="Create Account"
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitButton}
      />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin} disabled={submitting}>
          <Text style={styles.footerLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.title,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  generalError: {
    backgroundColor: colors.dangerMuted,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  generalErrorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footerLink: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
