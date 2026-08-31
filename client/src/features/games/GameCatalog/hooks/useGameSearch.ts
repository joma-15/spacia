import { useMemo, useState } from 'react';
import { GameCategory, GameCategoryFilterId } from '../types';

// Filters a list of game items by active category tab and live search query.
export function useGameSearch(
  categories: GameCategory[],
  initialCategory: GameCategoryFilterId = 'all'
) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategoryFilterId>(initialCategory);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((game) => {
      // 1. Category Filter
      const matchesCategory =
        selectedCategory === 'all' ||
        (Array.isArray(game.categories) && game.categories.includes(selectedCategory));

      if (!matchesCategory) {
        return false;
      }

      // 2. Search Query Filter
      if (!query) {
        return true;
      }

      const matchesTitle = game.title.toLowerCase().includes(query);
      const matchesTag =
        Array.isArray(game.categories) &&
        game.categories.some((tag) => tag.toLowerCase().includes(query));

      return matchesTitle || matchesTag;
    });
  }, [search, categories, selectedCategory]);

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    filteredCategories,
  };
}

