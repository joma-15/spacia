import { ImageSourcePropType } from 'react-native';
import type { Href } from 'expo-router';

export type GameCategoryFilterId = 'all' | 'singleplayer' | 'multiplayer' | (string & {});

export interface GameCategoryTab {
  id: GameCategoryFilterId;
  label: string;
  icon?: string;
}

export interface GameCategory {
  id: string;
  title: string;
  image: ImageSourcePropType;
  tint: string; // accent color per card (top tab + badge)
  route: Href; // screen name to navigate to, e.g. '/games/FlipSort'
  categories?: GameCategoryFilterId[]; // list of category tags, e.g. ['singleplayer', 'multiplayer']
  description?: string;
}

export interface GameCardProps {
  category: GameCategory;
  onPress: (category: GameCategory) => void;
}

export interface CategoryTabsProps {
  tabs: GameCategoryTab[];
  activeTab: GameCategoryFilterId;
  onSelectTab: (tabId: GameCategoryFilterId) => void;
}

