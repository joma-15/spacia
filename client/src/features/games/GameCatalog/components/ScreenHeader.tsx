import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface ScreenHeaderProps {
  greeting: string;
  title: string;
  onSettingsPress?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  greeting,
  title,
  // onSettingsPress,
}) => {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.eyebrow}>{greeting}</Text>
        <Text style={styles.heading}>{title}</Text>
      </View>
      {/* <Pressable style={styles.settingsButton} onPress={onSettingsPress} hitSlop={8}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </Pressable> */}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    maxWidth: 240,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
});
