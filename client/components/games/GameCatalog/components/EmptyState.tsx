import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '🕹️',
  title,
  subtitle,
}) => {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
