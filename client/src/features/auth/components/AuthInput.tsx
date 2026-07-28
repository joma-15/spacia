import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, radius, spacing, typography } from '../styles/styles';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

/**
 * Single reusable input used by Login, Register, and Forgot Password so
 * styling, error display, and password toggling only live in one place.
 */
const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, error, isPassword, secureTextEntry, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);

    const showToggle = isPassword;
    const isSecure = isPassword ? hidden : secureTextEntry;

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            focused && styles.inputWrapperFocused,
            !!error && styles.inputWrapperError,
          ]}
        >
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={isSecure}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            {...rest}
          />
          {showToggle && (
            <TouchableOpacity
              onPress={() => setHidden((h) => !h)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.toggle}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            >
              <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';
export default AuthInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.borderFocused,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
  },
  toggle: {
    paddingLeft: spacing.sm,
  },
  toggleText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});
