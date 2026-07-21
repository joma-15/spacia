import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { colors } from '../constants/colors';
import { GameCardProps } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20; // must match GameCatalog's scrollContent paddingHorizontal
const GAP = 10; // was 14 — slightly smaller gap gives each card a bit more width
const NUM_COLUMNS = 3;

export const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export const GameCard: React.FC<GameCardProps> = ({ category, onPress }) => {
  return (
    <Pressable
      onPress={() => onPress(category)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <View style={styles.cardImageWrap}>
        <Image source={category.image} style={styles.cardImage} resizeMode="cover" />
        <View style={[styles.cornerMark, styles.cornerTopLeft, { backgroundColor: category.tint }]} />
        <View style={[styles.cornerMark, styles.cornerBottomRight, { backgroundColor: category.tint }]} />
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
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    flexDirection: 'column',
    marginBottom: GAP,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  cardImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3, // was 16/9 — slightly taller image area
    backgroundColor: colors.bgSoft,
    overflow: 'hidden',
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },
  cornerMark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cornerTopLeft: {
    top: 5,
    left: 5,
  },
  cornerBottomRight: {
    bottom: 5,
    right: 5,
  },
  cardBody: {
    paddingVertical: 8, // was 6
    paddingHorizontal: 8, // was 6
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 12, // was 11
    fontWeight: '700',
    textAlign: 'center',
  },
});