import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import { validateEmail } from '../validation';
import { colors, radius, spacing, typography } from '../styles/styles';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const check = validateEmail(email);
    if (!check.valid) {
      setError(check.message);
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      // Always show the same success state, regardless of whether the
      // email is registered — never reveal account existence.
      setSent(true);
    } catch {
      setError("Couldn't send the reset email right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIconCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.successText}>
          If an account exists with this email, a password reset link has been sent.
        </Text>
        <AuthButton title="Back to Log In" onPress={onBackToLogin} style={styles.submitButton} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.subheading}>
        Enter the email linked to your account and we&apos;ll send you a reset link.
      </Text>

      <AuthInput
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (error) setError(undefined);
        }}
        error={error}
        keyboardType="email-address"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!submitting}
      />

      <AuthButton
        title="Send Reset Link"
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitButton}
      />

      <TouchableOpacity onPress={onBackToLogin} disabled={submitting} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back to Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.title,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subheading: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  backLink: {
    alignSelf: 'center',
  },
  backLinkText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successIcon: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '800',
  },
  successText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
