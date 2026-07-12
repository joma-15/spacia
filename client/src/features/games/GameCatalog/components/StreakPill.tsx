import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StreakPillProps {
  label: string;
}

export const StreakPill: React.FC<StreakPillProps> = ({ label }) => {
  return (
    <View style={styles.streakPill}>
      {/* <Text style={styles.streakEmoji}>{emoji}</Text> */}
      <MaterialCommunityIcons
      name="gamepad"
      size={22}
      color={colors.streakText}
      style={styles.streakEmoji}
      />
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
