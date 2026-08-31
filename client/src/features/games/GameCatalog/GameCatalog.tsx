import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  GAME_CATEGORIES,
  GAME_CATEGORY_TABS,
} from "./constants/gameCategories";
import { useGameSearch } from "./hooks/useGameSearch";
import {
  ScreenHeader,
  StreakPill,
  SearchBar,
  CategoryTabs,
  SectionHeader,
  GameCard,
  EmptyState,
} from "./components";
import { GameCategory } from "./types";

interface GameCatalogProps {
  onSelectGame: (category: GameCategory) => void;
  onSettingsPress?: () => void;
  onSeeAllPress?: () => void;
  level?: number;
  gamesToday?: number;
}

const HORIZONTAL_PADDING = 16; // must match GameCard.tsx's HORIZONTAL_PADDING
const GAP = 10; // must match GameCard.tsx's GAP

// The scrollable body of the gaming home screen: header, streak pill,
// search, category tabs filter, and the grid of playable games.
export const GameCatalog: React.FC<GameCatalogProps> = ({
  onSelectGame,
  onSettingsPress,
  onSeeAllPress,
  level = 7,
  gamesToday = 3,
}) => {
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    filteredCategories,
  } = useGameSearch(GAME_CATEGORIES);

  const getSectionTitle = () => {
    const activeTab = GAME_CATEGORY_TABS.find((t) => t.id === selectedCategory);
    return activeTab ? activeTab.label : "Games";
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        greeting="WELCOME BACK,"
        title="Ready to play?"
        onSettingsPress={onSettingsPress}
      />

      <StreakPill label={`Level ${level} · ${gamesToday} games today`} />

      <SearchBar value={search} onChangeText={setSearch} />

      <CategoryTabs
        tabs={GAME_CATEGORY_TABS}
        activeTab={selectedCategory}
        onSelectTab={setSelectedCategory}
      />

      {/* <SectionHeader title={getSectionTitle()} onActionPress={onSeeAllPress} /> */}
      <View style={styles.sectionHeader}>
        <SectionHeader
          title={getSectionTitle()}
          onActionPress={onSeeAllPress}
        />
      </View>

      <View style={styles.grid}>
        {filteredCategories.map((category) => (
          <GameCard
            key={category.id}
            category={category}
            onPress={onSelectGame}
          />
        ))}
        {filteredCategories.length === 0 && (
          <EmptyState
            title="No games found"
            subtitle={
              search.trim()
                ? "Try a different search term or category"
                : "No games available in this category yet"
            }
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING, // must match HORIZONTAL_PADDING in GameCard.tsx
    paddingBottom: 32,
  },

  sectionHeader: {
    marginTop : -8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: GAP,
    columnGap: GAP,
  },
});
