import { ImageSourcePropType } from 'react-native';

export interface GameCategory {
  id: string;
  title: string;
  image: ImageSourcePropType;
  tint: string; // accent color per card (top tab + badge)
  route: string; // screen name to navigate to, e.g. 'QuizBattle'
}

export interface GameCardProps {
  category: GameCategory;
  onPress: (category: GameCategory) => void;
}
