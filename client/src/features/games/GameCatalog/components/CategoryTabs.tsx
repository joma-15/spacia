import React from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors } from '../constants/colors';
import { CategoryTabsProps } from '../types';

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  tabs,
  activeTab,
  onSelectTab,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelectTab(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              isActive ? styles.tabActive : styles.tabInactive,
              pressed && styles.tabPressed,
            ]}
            android_ripple={{
              color: isActive ? 'rgba(0,0,0,0.12)' : 'rgba(52,211,153,0.15)',
              borderless: false,
            }}
          >
            <Text
              style={[
                styles.tabText,
                isActive ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    marginTop: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  tabInactive: {
    backgroundColor: colors.bgSoft,
    borderColor: colors.cardBorder,
  },
  tabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#091810',
  },
  tabTextInactive: {
    color: colors.textMuted,
  },
});
