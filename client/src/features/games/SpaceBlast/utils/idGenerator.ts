/**
 * Creates a tiny counter function. Every call to the returned function
 * gives you a new number, one higher than the last.
 *
 * Used anywhere we need a unique id for something on screen (a floating
 * answer, a bullet, an explosion) without pulling in a UUID library.
 *
 * Example:
 *   const nextBulletId = makeIdGenerator();
 *   const id1 = nextBulletId(); // 0
 *   const id2 = nextBulletId(); // 1
 */
export function makeIdGenerator(): () => number {
  let current = 0;
  return () => current++;
}
