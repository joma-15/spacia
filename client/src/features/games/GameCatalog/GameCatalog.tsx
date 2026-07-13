import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { GAME_CATEGORIES } from './constants/gameCategories';
import { useGameSearch } from './hooks/useGameSearch';
import {
  ScreenHeader,
  StreakPill,
  SearchBar,
  SectionHeader,
  GameCard,
  EmptyState,
} from './components';
import { GameCategory } from './types';

interface GameCatalogProps {
  onSelectGame: (category: GameCategory) => void;
  onSettingsPress?: () => void;
  onSeeAllPress?: () => void;
  level?: number;
  gamesToday?: number;
}

// The scrollable body of the gaming home screen: header, streak pill,
// search, and the grid of playable game categories.
export const GameCatalog: React.FC<GameCatalogProps> = ({
  onSelectGame,
  onSettingsPress,
  onSeeAllPress,
  level = 7,
  gamesToday = 3,
}) => {
  const { search, setSearch, filteredCategories } = useGameSearch(GAME_CATEGORIES);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        greeting="WELCOME BACK,"
        title="Ready to play?"
        onSettingsPress={onSettingsPress}
      />

      <StreakPill label={`Level ${level} · ${gamesToday} games today`} />

      <SearchBar value={search} onChangeText={setSearch} />

      <SectionHeader title="Game Categories" onActionPress={onSeeAllPress} />

      <View style={styles.cardList}>
        {filteredCategories.map((category) => (
          <GameCard key={category.id} category={category} onPress={onSelectGame} />
        ))}
        {filteredCategories.length === 0 && (
          <EmptyState title="No games found" subtitle="Try a different search term" />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20, // must match HORIZONTAL_PADDING in GameCard.tsx
    paddingBottom: 32,
  },
  cardList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});