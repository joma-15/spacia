import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface StreakPillProps {
  emoji?: string;
  label: string;
}

export const StreakPill: React.FC<StreakPillProps> = ({ emoji = '🎮', label }) => {
  return (
    <View style={styles.streakPill}>
      <Text style={styles.streakEmoji}>{emoji}</Text>
      <Text style={styles.streakText}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.streakBg,
    borderColor: colors.streakBorder,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 20,
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  streakText: {
    color: colors.streakText,
    fontWeight: '700',
    fontSize: 13,
  },
});
