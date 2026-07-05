import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../GameCatalog/constants/colors';

// Placeholder screen for the "MemoryMatch" game.
// Replace this with the real game UI + logic.
const MemoryMatch: React.FC = () => {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>MemoryMatch</Text>
      <Text style={styles.subtitle}>Game logic goes here.</Text>
    </View>
  );
};

export default MemoryMatch;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
