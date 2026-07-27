/**
 * Shuffles an array into a random order and returns a NEW array
 * (the original array you pass in is never changed).
 *
 * This is the "Fisher-Yates" shuffle — a well-known, simple way to
 * shuffle a list so every possible order is equally likely.
 */
export function fisherYatesShuffle<T>(input: T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
