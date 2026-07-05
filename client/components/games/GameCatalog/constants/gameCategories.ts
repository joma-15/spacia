import { GameCategory } from '../types';

// Sample data — swap `image` for your own assets (require(...) or {uri:...})
export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: '1',
    title: 'Quiz Battle',
    image: { uri: 'https://images.unsplash.com/photo-1642132652075-2cd7946ed693?w=600&q=80' },
    tint: '#5B8DEF',
    route: 'QuizBattle',
  },
  {
    id: '2',
    title: 'Word Rush',
    image: { uri: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=600&q=80' },
    tint: '#34D399',
    route: 'WordRush',
  },
  {
    id: '3',
    title: 'Memory Match',
    image: { uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80' },
    tint: '#E86A92',
    route: 'MemoryMatch',
  },
];
