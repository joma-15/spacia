import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth, AuthError } from '../hooks/useAuth';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import { colors, spacing, typography } from '../styles/styles';
import { LoginFieldErrors } from '../types';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
}

export default function LoginForm({
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSuccess,
}: LoginFormProps) {
  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextErrors: LoginFieldErrors = {};
    if (!identifier.trim()) nextErrors.identifier = 'Enter your username or email';
    if (!password) nextErrors.password = 'Enter your password';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      onSuccess();
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.field === 'general' || !err.field) {
          setErrors({ general: err.message });
        } else {
          setErrors({ [err.field]: err.message } as LoginFieldErrors);
        }
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>Log in to keep your streak going.</Text>

      {!!errors.general && (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      )}

      <AuthInput
        label="Username or Email"
        placeholder="e.g. jane_doe"
        value={identifier}
        onChangeText={(t) => {
          setIdentifier(t);
          if (errors.identifier) setErrors((e) => ({ ...e, identifier: undefined }));
        }}
        error={errors.identifier}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!submitting}
      />

      <AuthInput
        ref={passwordRef}
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        error={errors.password}
        isPassword
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!submitting}
      />

      <TouchableOpacity
        onPress={onSwitchToForgotPassword}
        style={styles.forgotLink}
        disabled={submitting}
      >
        <Text style={styles.forgotLinkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <AuthButton title="Log In" onPress={handleSubmit} loading={submitting} style={styles.submitButton} />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don&apos;t have an account? </Text>
        <TouchableOpacity onPress={onSwitchToRegister} disabled={submitting}>
          <Text style={styles.footerLink}>Create Account</Text>
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.xs,
  },
  forgotLinkText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
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
