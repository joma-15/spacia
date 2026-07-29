import { Dimensions } from "react-native";

/* ═══════════════════════════════════════════════════════════════════════
 * CONSTANTS — fixed numbers and asset paths used across the game.
 * If you're tweaking difficulty, sizing, or timing, this is the file
 * to change first.
 * ═══════════════════════════════════════════════════════════════════════ */

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export const NUM_SHOOTING_STAR_SLOTS = 2;
export const SHIP_DEFAULT_SIZE = 160;
export const BULLET_SPEED = 700;
export const HEADER_HEIGHT = 56;
export const QUESTION_CARD_HEIGHT = 92;
export const QUESTION_CARD_MARGIN = 12;

export const ANSWER_OBJECT_SIZE = 90;

// Quizlet-Blast-style floating answers: only a handful of real answers
// (pulled from the whole flashcard bank) float at once — never made-up
// distractors, and never the full deck at a time.
export const FLOATING_ANSWER_MIN = 4;
export const FLOATING_ANSWER_MAX = 5;

// The player needs at least this many flashcards for the answer pool to
// have enough real distractors to feel varied.
export const MIN_FLASHCARDS_REQUIRED = 10;

// How many recently-shown answers the pool avoids immediately re-using,
// so the same distractor doesn't reappear round after round.
export const RECENT_ANSWER_HISTORY_SIZE = 6;

export const FLOAT_MIN_DURATION = 2200;
export const FLOAT_MAX_DURATION = 3800;
export const FLOAT_AMPLITUDE_Y = 14;
export const FLOAT_AMPLITUDE_X = 10;

export const EXPLOSION_DURATION_MS = 380;

// One explosion image per outcome, plus the spaceship — swap these for
// your actual files. All three are preloaded up front (see
// useAssetPreload.ts) so nothing pops in blank the first time it renders.
export const EXPLOSION_IMAGE_CORRECT = require("@/assets/images/explosion-correct.webp");
export const EXPLOSION_IMAGE_WRONG = require("@/assets/images/explosion-wrong.webp");
export const SPACESHIP_IMAGE = require("@/assets/images/spaceship.webp");

// Every image module the game needs on screen. Passed to
// `Asset.loadAsync` on mount so bitmaps are downloaded/decoded before
// the game is allowed to start.
export const GAME_IMAGE_ASSETS = [
  EXPLOSION_IMAGE_CORRECT,
  EXPLOSION_IMAGE_WRONG,
  SPACESHIP_IMAGE,
];
