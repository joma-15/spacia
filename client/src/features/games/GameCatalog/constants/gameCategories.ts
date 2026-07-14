import { GameCategory } from '../types';

const BASE_PATH = '../../../../../assets/images'

// Sample data — swap `image` for your own assets (require(...) or {uri:...})
export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: '1',
    title: 'Space blast',
    image: require(`${BASE_PATH}/drei.jpg`),
    tint: '#5B8DEF',
    route: 'Space Blast',
  },
  {
    id: '2',
    title: 'Luis The Destroyer',
    image: require(`${BASE_PATH}/luis.jpg`),
    tint: '#34D399',
    route: 'WordRush',
  },
  {
    id: '3',
    title: 'Lb Jed',
    image: require(`${BASE_PATH}/jed.jpg`),
    tint: '#E86A92',
    route: 'MemoryMatch',
  },
];
