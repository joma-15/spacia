import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, Platform } from 'react-native';
import { colors } from '../constants/colors';
import { GameCardProps } from '../types';

export const GameCard: React.FC<GameCardProps> = ({ category, onPress }) => {
  return (
    <Pressable
      onPress={() => onPress(category)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      {/* Colored accent tab, mirrors the folder-tab look in the reference */}
      <View style={[styles.cardTopTab, { backgroundColor: category.tint }]} />

      <View style={styles.cardImageWrap}>
        <Image source={category.image} style={styles.cardImage} resizeMode="cover" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {category.title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  cardTopTab: {
    position: 'absolute',
    top: 0,
    left: 18,
    width: 28,
    height: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.bgSoft,
    marginRight: 14,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
});
