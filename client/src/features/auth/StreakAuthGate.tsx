import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AuthProvider, useAuth } from '../auth/hooks/useAuth';
import AuthModal from '../auth/components/AuthModal';
import AuthButton from '../auth/components/AuthButton';
import { colors, spacing, typography } from '../auth/styles/styles';
import { AuthMode } from '../auth/types';

interface StreakAuthGateProps {
  /** The real Streak feature, rendered once the user is authenticated. */
  children: React.ReactNode;
}

/**
 * Drop this in place of the old "Coming Soon" screen inside the Streak tab:
 *
 *   <StreakAuthGate>
 *     <CardScreen />
 *   </StreakAuthGate>
 *
 * StreakAuthGate owns its own <AuthProvider> so it can be adopted
 * incrementally without wiring auth into the whole app. If the app already
 * has a global AuthProvider higher up the tree, remove the inner provider
 * here and this component will pick up the ancestor's context instead.
 */
export default function StreakAuthGate({ children }: StreakAuthGateProps) {
  return (
    <AuthProvider>
      <StreakAuthGateInner>{children}</StreakAuthGateInner>
    </AuthProvider>
  );
}

function StreakAuthGateInner({ children }: StreakAuthGateProps) {
  const { isAuthenticated, isRestoring } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<AuthMode>('login');

  const openModal = (mode: AuthMode = 'login') => {
    setModalMode(mode);
    setModalVisible(true);
  };

  if (isRestoring) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    // Authentication state updates immediately, so this swaps in as soon
    // as login/register resolves — no manual refresh needed.
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🔥</Text>
        </View>

        <Text style={styles.title}>Sign in to continue</Text>
        <Text style={styles.subtitle}>
          Log in to sync your streaks across devices and never lose your progress.
        </Text>

        <AuthButton title="Log In" onPress={() => openModal('login')} style={styles.loginButton} />
      </View>

      <AuthModal
        visible={modalVisible}
        initialMode={modalMode}
        onClose={() => setModalVisible(false)}
        onAuthenticated={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 42,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  loginButton: {
    minWidth: 200,
  },
});
