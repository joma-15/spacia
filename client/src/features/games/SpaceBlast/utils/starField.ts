import { SCREEN_W, SCREEN_H } from "../constants";
import { StarConfig } from "../types";

/**
 * Builds a list of random background stars (position, size, how long
 * each one takes to twinkle). Purely decorative — has nothing to do
 * with gameplay.
 */
export function generateStars(count: number): StarConfig[] {
  return Array.from({ length: count }, (_, i) => {
    const size = Math.random() * 2 + 1;
    return {
      id: i,
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      size,
      duration: 1000 + Math.random() * 2500,
      delay: Math.random() * 3000,
      maxOpacity: 0.4 + Math.random() * 0.6,
    };
  });
}
