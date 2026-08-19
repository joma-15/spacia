import { Dimensions } from "react-native";

/* ═══════════════════════════════════════════════════════════════════════
 * CONSTANTS — fixed numbers and asset paths used across the game.
 * If you're tweaking difficulty, sizing, or timing, this is the file
 * to change first.
 * ═══════════════════════════════════════════════════════════════════════ */

export const NUM_SHOOTING_STAR_SLOTS = 2;
export const SHIP_DEFAULT_SIZE = 160;
export const BULLET_SPEED = 700;
export const HEADER_HEIGHT = 56;
export const QUESTION_CARD_HEIGHT = 92;
export const QUESTION_CARD_MARGIN = 12;

// Exactly three real answer choices are visible for every question.
export const FLOATING_ANSWER_COUNT = 3;
export const BUBBLE_GAP = 14;
export const BUBBLE_EDGE_GAP = 10;
export const BUBBLE_SPEED_MIN = 22;
export const BUBBLE_SPEED_MAX = 34;

// The player needs at least this many flashcards for the answer pool to
// have enough real distractors to feel varied.
export const MIN_FLASHCARDS_REQUIRED = 10;

// How many recently-shown answers the pool avoids immediately re-using,
// so the same distractor doesn't reappear round after round.
export const RECENT_ANSWER_HISTORY_SIZE = 6;

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
// Decorative stars use a snapshot of the window; gameplay never does.
export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
