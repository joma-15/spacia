import { GameCategory } from '../types';

const BASE_PATH = '../../../../../assets/images'

// Sample data — swap `image` for your own assets (require(...) or {uri:...})
export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'flip-sort',
    title: 'Flip & Sort',
    image: require(`${BASE_PATH}/flip-sort.webp`),
    tint: '#3ED598',
    route: '/games/FlipSort' as any,
  },
  {
    id: '1',
    title: 'Space blast',
    image: require(`${BASE_PATH}/spaceblast.webp`),
    tint: '#5B8DEF',
    route: '/games/SpaceBlast'
  },
  {
    id: '2',
    title: 'Quizzy',
    image: require(`${BASE_PATH}/quizzy.webp`),
    tint: '#34D399',
    route: '/games/Quizzy',
  },
  // {
  //   id: '3',
  //   title: 'MemoryMatch',
  //   image: require(`${BASE_PATH}/jed.jpg`),
  //   tint: '#E86A92',
  //   route: '/games/MemoryMatch',
  // },
];
