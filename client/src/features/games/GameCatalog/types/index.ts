import { ImageSourcePropType } from 'react-native';
import type { Href } from 'expo-router';

export interface GameCategory {
  id: string;
  title: string;
  image: ImageSourcePropType;
  tint: string; // accent color per card (top tab + badge)
  route: Href; // screen name to navigate to, e.g. 'QuizBattle'
}

export interface GameCardProps {
  category: GameCategory;
  onPress: (category: GameCategory) => void;
}
