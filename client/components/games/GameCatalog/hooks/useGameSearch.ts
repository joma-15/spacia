import { useMemo, useState } from 'react';
import { GameCategory } from '../types';

// Filters a list of game categories by a live search query.
export function useGameSearch(categories: GameCategory[]) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      category.title.toLowerCase().includes(query)
    );
  }, [search, categories]);

  return { search, setSearch, filteredCategories };
}
