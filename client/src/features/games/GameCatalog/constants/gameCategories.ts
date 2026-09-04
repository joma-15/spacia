import { GameCategory, GameCategoryTab } from '../types';

const BASE_PATH = '../../../../../assets/images';

/**
 * Category tabs displayed at the top of the Game Catalog screen.
 * To add a new category in the future:
 *   1. Add an entry here (e.g. `{ id: 'brain-training', label: 'Brain Training' }`)
 *   2. Tag games with that category ID in their `categories` array below.
 */
export const GAME_CATEGORY_TABS: GameCategoryTab[] = [
  { id: 'all', label: 'All Games' },
  { id: 'singleplayer', label: 'Single Player' },
  { id: 'multiplayer', label: 'Multiplayer' },
];

/**
 * List of available games in the catalog.
 * To add a new game:
 *   - Add a new object with `id`, `title`, `image`, `tint`, `route`, and `categories`.
 *   - `categories` is an array of category IDs (e.g., `['singleplayer']`, `['singleplayer', 'multiplayer']`).
 */
export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'flip-sort',
    title: 'Flip & Sort',
    image: require(`${BASE_PATH}/flip-sort.webp`),
    tint: '#3ED598',
    route: '/games/FlipSort' as any,
    categories: ['singleplayer'],
  },
  {
    id: '1',
    title: 'Space blast',
    image: require(`${BASE_PATH}/spaceblast.webp`),
    tint: '#5B8DEF',
    route: '/games/SpaceBlast',
    categories: ['singleplayer'],
  },
  {
    id: '2',
    title: 'Quizzy',
    image: require(`${BASE_PATH}/quizzy.webp`),
    tint: '#34D399',
    route: '/games/Quizzy',
    categories: ['multiplayer'],
  },
  {
    id: '3',
    title: 'MemoryMatch',
    image: require(`${BASE_PATH}/spaceblast.webp`),
    tint: '#E86A92',
    route: '/games/MemoryMatch',
    categories: ['singleplayer', 'multiplayer'],
  },
  {
    id: '4',
    title: 'AttackonTitan',
    image: require(`${BASE_PATH}/quizzy.webp`),
    tint: '#E86A92',
    route: '/games/MemoryMatch',
    categories: ['singleplayer', 'multiplayer'], 
  },
  {
    id: '5',
    title: 'AttackonTitan',
    image: require(`${BASE_PATH}/flip-sort.webp`),
    tint: '#E86A92',
    route: '/games/MemoryMatch',
    categories: ['singleplayer', 'multiplayer'], 
  }, 
  {
    id: '6',
    title: 'AttackonTitan',
    image: require(`${BASE_PATH}/flip-sort.webp`),
    tint: '#E86A92',
    route: '/games/MemoryMatch',
    categories: ['singleplayer', 'multiplayer'], 
  }, 
  {
    id: '7',
    title: 'AttackonTitan',
    image: require(`${BASE_PATH}/flip-sort.webp`),
    tint: '#E86A92',
    route: '/games/MemoryMatch',
    categories: ['singleplayer', 'multiplayer'], 
  }, 
  {
    id: '8',
    title: 'AttackonTitan',
    image: require(`${BASE_PATH}/flip-sort.webp`),
    tint: '#E86A92',
    route: '/games/MemoryMatch',
    categories: ['singleplayer', 'multiplayer'], 
  },
];

