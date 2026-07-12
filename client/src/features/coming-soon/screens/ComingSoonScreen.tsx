import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
// If you use lucide-react-native or @expo/vector-icons, swap the emoji below for a real icon.
// import { ArrowLeft, Sparkles } from 'lucide-react-native';

interface ComingSoonScreenProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function ComingSoonScreen({
  title = 'Coming Soon',
  subtitle = "We're working on something great. This feature will be available shortly.",
  onBack,
}: ComingSoonScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1F17" />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🚧</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>In Development</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const BACKGROUND = '#0D1F17';
const ACCENT = '#34D399'; // green accent used across the app
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA8A2';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: TEXT_PRIMARY,
    fontSize: 26,
    marginTop: -2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconEmoji: {
    fontSize: 42,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  badgeText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
});