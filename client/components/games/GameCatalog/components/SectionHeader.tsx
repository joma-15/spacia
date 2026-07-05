import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel = 'See all →',
  onActionPress,
}) => {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable hitSlop={8} onPress={onActionPress}>
        <Text style={styles.seeAll}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  seeAll: {
    color: colors.accentGreen,
    fontWeight: '700',
    fontSize: 13,
  },
});
