import { Animated } from "react-native";

/* ═══════════════════════════════════════════════════════════════════════
 * This file only holds TYPE / INTERFACE definitions.
 * No logic lives here — if you're adding behavior, it probably belongs
 * in a hook or a util file instead.
 * ═══════════════════════════════════════════════════════════════════════ */

/* ----------------------------- Flashcards ----------------------------- */

export type CardStatus = "review" | "understood";

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  status: CardStatus;
}

export interface StudySet {
  id: string;
  name: string;
  subtitle?: string;
}

/* ----------------------------- Main game props ----------------------------- */

export interface SpaceBackgroundProps {
  starCount?: number;
  shootingStars?: boolean;
  backgroundColor?: string;
  style?: any;
  shipSize?: number;

  onBack?: () => void;

  studySets?: StudySet[];
  currentStudySetId?: string;
  onSelectStudySet?: (set: StudySet) => void;

  // The flashcards that drive the whole game. One card = one question
  // (`card.question`) with exactly one correct answer (`card.answer`).
  // Floating answer bubbles are ALWAYS pulled from other cards' `answer`
  // fields — never invented.
  flashcards?: FlashCard[];

  // Minimum number of flashcards required to start the game. Defaults to 10.
  minFlashcards?: number;

  // Called when the player taps "Go to Library" on the not-enough-cards modal.
  onGoToLibrary?: () => void;

  onAnswer?: (cardId: string, correct: boolean, answerText: string) => void;

  // Called right when the "You Win" modal's OK button is pressed.
  onWin?: () => void;

  // Number of hearts/lives the player starts with.
  maxLives?: number;

  // Called right when the Game Over modal's OK button is pressed.
  onGameOver?: () => void;

  maxBullets?: number;
  fireCooldownMs?: number;

  // Set true while the caller is still fetching the `flashcards` prop.
  // The loading screen stays up until this flips back to false.
  isDataLoading?: boolean;

  children?: React.ReactNode;
}

/* ----------------------------- Background stars ----------------------------- */

export interface StarConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  maxOpacity: number;
}

/* ----------------------------- Floating answer bubbles ----------------------------- */

// One floating "space rock" showing a possible answer.
export interface SpaceObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  stop: () => void;
  label: string;
  isCorrect: boolean;
  laneIndex: number;
}

export interface RockPalette {
  colors: [string, string];
  glow: string;
  border: string;
  craterColor: string;
}

/* ----------------------------- Bullets & explosions ----------------------------- */

export interface Bullet {
  id: number;
  anim: Animated.ValueXY;
}

export type HitState = "correct" | "wrong";

// Maps a floating answer's id to whether it was just hit correctly or wrongly.
export type HitStatesMap = Record<number, HitState>;

// A one-shot visual effect spawned wherever a bubble was just hit.
export interface Explosion {
  id: number;
  x: number;
  y: number;
  size: number;
  variant: HitState;
}
