/**
 * SubwaySurferGame.tsx
 *
 * A simplified "Subway Surfers" style endless-runner built with plain
 * React Native Views (boxes) — no images, no game engine libraries — except
 * for the player, which renders as an animated ninja sprite: a 6-frame run
 * cycle normally, and a 3-frame dash animation (with a trail effect)
 * triggered by swiping up.
 *
 * Theme: Spacia's dark green design system (#0D1F17 background, #34D399
 * accent), matching the app's home screen.
 *
 * Top bar: copied from Quizzy — a back button and a "change folder" button.
 * The whole screen is wrapped in SafeAreaView and also reads
 * useSafeAreaInsets so the game area and score chip never sit under the
 * device's bottom nav bar / home indicator.
 *
 * Power-ups: small green circles fall down the lanes alongside the
 * obstacles. Grabbing one pauses the run and pops up a quiz question with
 * three choices — the player can answer or pass. A correct answer grants a
 * score bonus; a wrong answer or a pass just resumes the run with no
 * penalty. `POWER_UP_QUESTIONS` is a placeholder bank — swap it for real
 * flashcard-derived questions (same shape used in Quizzy) once this game is
 * wired to a folder. To answer a power-up question the player must pick one
 * of the three options — there's no skip. Obstacles and power-ups are both
 * spawned from inside the same game tick, which picks each one's lane by
 * checking current positions (and, on ticks where both spawn, each other's
 * pick) so the two can never land in the same spot or overlap.
 *
 * Dash: every left/right swipe that changes lanes also plays a one-shot
 * 3-frame dash animation, shows a trail effect behind the ninja, briefly
 * speeds up obstacle/power-up movement (DASH_SPEED_MULTIPLIER below), and
 * makes the player briefly immune to collisions. The dash cannot be
 * re-triggered while one is already playing, and is force-ended if the game
 * ends or a power-up question pops up mid-dash.
 *
 * Difficulty progression: obstacles/power-ups fall faster the longer a
 * single run lasts (FALL_SPEED_RAMP_PER_TICK), AND runs start a little
 * faster the higher your all-time best score is (HIGH_SCORE_SPEED_BONUS_PER_POINT),
 * so the game keeps getting harder as you improve, not just within one run.
 * All of the knobs for this live together near the top of the file so
 * they're easy to find and retune later.
 *
 * How it works:
 * - The screen is split into 3 vertical lanes.
 * - The player (an animated ninja sprite) sits near the bottom and can
 *   slide left/right between lanes by swiping — each lane swipe also
 *   triggers a dash.
 * - Obstacles (colored boxes) and power-ups (circles) spawn at the top of
 *   a random lane and fall downward every game "tick".
 * - If an obstacle reaches the player's row while in the same lane (and
 *   the player isn't dashing), it's a collision -> Game Over.
 * - If a power-up reaches the player's row in the same lane, it's
 *   collected -> the run pauses and a question pops up.
 * - Score increases automatically the longer you survive.
 *
 * Everything runs off a single game loop (setInterval) that updates
 * obstacle/power-up positions, checks collisions, and spawns new ones.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Pressable,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAssetPreload } from "./hooks/useAssetPreload";
import LoadingOverlay from "./components/LoadingOverlay";

// ---------------------------------------------------------------------------
// Spacia theme tokens — mirrors the shared THEME object used across the app
// ---------------------------------------------------------------------------

const THEME = {
  background: "#0D1F17",
  surface: "#16281F", // card surface, slightly lighter than bg
  surfaceAlt: "#1C2F25", // secondary card / divider surface
  accent: "#34D399", // primary green accent (player, buttons, highlights)
  accentDim: "rgba(52, 211, 153, 0.18)", // soft accent fill
  obstacle: "#2E4237", // muted card-like obstacle color
  obstacleBorder: "rgba(52, 211, 153, 0.25)",
  powerUp: "#FBBF24", // gold, so it reads distinctly from obstacles
  powerUpGlow: "rgba(251, 191, 36, 0.35)",
  danger: "#F87171",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  overlay: "rgba(13, 31, 23, 0.85)",
  divider: "rgba(255, 255, 255, 0.08)",
};

// ---------------------------------------------------------------------------
// Constants — tweak these to change game feel
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const LANE_COUNT = 3;
const LANE_WIDTH = SCREEN_WIDTH / LANE_COUNT;

const PLAYER_SIZE = 80;
const PLAYER_BOTTOM_OFFSET = 100; // distance from bottom of the game area

const OBSTACLE_WIDTH = 100;
const OBSTACLE_HEIGHT = 100;

//sprite for obstacle
const OBSTACLE_OBJECT = require("@/assets/images/obstacle1.png");

//sprite for scroll
const SCROLL_OBJECT = require("@/assets/images/scroll1.png");

// Frames for the ninja while moving — swapped through in sequence to
// produce a running animation for the player sprite.
const NINJA_RUN_FRAMES = [
  require("../../../../assets/images/ninja-run-1.png"),
  require("../../../../assets/images/ninja-run-2.png"),
  require("../../../../assets/images/ninja-run-3.png"),
  require("../../../../assets/images/ninja-run-4.png"),
  require("../../../../assets/images/ninja-run-5.png"),
  require("../../../../assets/images/ninja-run-6.png"),
];
const NINJA_FRAME_INTERVAL_MS = 100; // how fast the run cycle animates

// Dash — a separate, one-shot 3-frame animation triggered by swiping up.
// Kept entirely independent of NINJA_RUN_FRAMES so the normal run cycle is
// never touched by the dash.
const NINJA_DASH_FRAMES = [
  require("../../../../assets/images/ninja-dash-1.png"),
  require("../../../../assets/images/ninja-dash-2.png"),
  require("../../../../assets/images/ninja-dash-3.png"),
];
const NINJA_DASH_FRAME_INTERVAL_MS = 60; // fast — the dash should feel snappy
// Purely visual effect rendered behind the ninja while dashing. Not part of
// the ninja sprite itself and never affects collision, lane position, or
// player size.
const NINJA_DASH_TRAIL = require("../../../../assets/images/ninja-dash-trail.png");

const POWER_UP_SIZE = 70; // small circle, deliberately smaller than obstacles

const GAME_TICK_MS = 16; // ~60fps
const SPAWN_INTERVAL_MS = 1200; // how often a new obstacle appears
const POWER_UP_SPAWN_INTERVAL_MS = 4500; // how often a power-up appears
const POWER_UP_BONUS_SCORE = 50; // score bonus for a correct answer
const MIN_SPAWN_GAP = 250; // minimum vertical clearance an obstacle or
// power-up must have from anything else already in its lane before it's
// allowed to spawn there, so the two never land on the same spot or overlap

// ---------------------------------------------------------------------------
// Difficulty progression knobs — kept together and named so they're easy to
// find and retune later without hunting through the tick loop.
// ---------------------------------------------------------------------------

const INITIAL_FALL_SPEED = 5; // pixels/tick a brand new run starts at
// (before any high-score bonus is applied — see getStartingFallSpeed below)
const MAX_FALL_SPEED = 16; // hard cap so a long run never becomes literally
// unplayable, no matter how long you survive

const FALL_SPEED_RAMP_PER_TICK = 0.002; // how much faster obstacles/
// power-ups get every single tick just from surviving in the *current* run

const HIGH_SCORE_SPEED_BONUS_PER_POINT = 0.0008; // each point of your
// all-time best score nudges up the STARTING speed of your next run, so
// the game keeps getting harder over time as you improve — not just within
// a single run. Set to 0 to disable this and always start at INITIAL_FALL_SPEED.
const MAX_HIGH_SCORE_SPEED_BONUS = 6; // cap on how much the high-score
// bonus above can add to the starting speed, however high your best score gets

const DASH_SPEED_MULTIPLIER = 1.6; // obstacles/power-ups move this much
// faster (relative to the current fall speed) for the brief duration of a
// dash, to sell the "burst of speed" feeling. Set to 1 to disable.

/**
 * The fall speed a fresh run should start at, given the player's all-time
 * best score. Centralized here so both the initial ref value and
 * `handleRestart` compute it the same way.
 */
function getStartingFallSpeed(bestScore: number): number {
  const highScoreBonus = Math.min(
    bestScore * HIGH_SCORE_SPEED_BONUS_PER_POINT,
    MAX_HIGH_SCORE_SPEED_BONUS,
  );
  return INITIAL_FALL_SPEED + highScoreBonus;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single obstacle box falling down a lane. */
interface Obstacle {
  id: number;
  lane: number; // 0, 1, or 2
  y: number; // current vertical position (top edge)
}

/** A single power-up circle falling down a lane. */
interface PowerUp {
  id: number;
  lane: number;
  y: number;
}

type OptionKey = "A" | "B" | "C";

interface PowerUpQuestion {
  question: string;
  options: Record<OptionKey, string>;
  correct: OptionKey;
}

type QuestionAnswerState = "idle" | "correct" | "wrong";

interface SubwaySurferGameProps {
  /** Optional — only needed if this instance is being driven by a specific folder context. */
  folderId?: string;
  folderName?: string;
  /**
   * Optional question bank for power-ups. Defaults to a small placeholder
   * set — swap in folder-derived questions (same `{question, options,
   * correct}` shape Quizzy builds) to tie power-ups to real flashcards.
   */
  powerUpQuestions?: PowerUpQuestion[];
}

const OPTION_KEYS: OptionKey[] = ["A", "B", "C"];

// Placeholder question bank — replace with real content as needed.
const DEFAULT_POWER_UP_QUESTIONS: PowerUpQuestion[] = [
  {
    question: "What is the capital of the Philippines?",
    options: { A: "Cebu City", B: "Manila", C: "Davao City" },
    correct: "B",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: { A: "Venus", B: "Jupiter", C: "Mars" },
    correct: "C",
  },
  {
    question: "What is 7 x 8?",
    options: { A: "54", B: "56", C: "64" },
    correct: "B",
  },
  {
    question: "Which gas do plants absorb from the air?",
    options: { A: "Oxygen", B: "Nitrogen", C: "Carbon dioxide" },
    correct: "C",
  },
  {
    question: "How many sides does a hexagon have?",
    options: { A: "5", B: "6", C: "7" },
    correct: "B",
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Returns the x position (left edge) for the center of a given lane. */
function getLaneX(lane: number, boxWidth: number): number {
  const laneCenter = lane * LANE_WIDTH + LANE_WIDTH / 2;
  return laneCenter - boxWidth / 2;
}

/** Clamp a lane index so it stays within [0, LANE_COUNT - 1]. */
function clampLane(lane: number): number {
  if (lane < 0) return 0;
  if (lane > LANE_COUNT - 1) return LANE_COUNT - 1;
  return lane;
}

/**
 * Returns [0, 1, ..., LANE_COUNT - 1] shuffled into a random order. Spawn
 * logic walks lanes in this order and stops at the first one that's clear,
 * which is what keeps obstacles and power-ups from ever spawning on top of
 * each other while still feeling random.
 */
function shuffleLanes(): number[] {
  const lanes = Array.from({ length: LANE_COUNT }, (_, i) => i);
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes;
}

function pickRandomQuestion(bank: PowerUpQuestion[]): PowerUpQuestion {
  return bank[Math.floor(Math.random() * bank.length)];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SubwaySurferGame({
  folderName,
  powerUpQuestions = DEFAULT_POWER_UP_QUESTIONS,
}: SubwaySurferGameProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const assetsReady = useAssetPreload();

  // Height of the actual playfield, after the top bar/header and after
  // reserving room at the bottom for the device's home indicator / nav bar.
  const [gameAreaHeight, setGameAreaHeight] = useState<number>(
    SCREEN_HEIGHT - 160,
  );
  const bottomReserve = Math.max(insets.bottom, 12) + 12;

  // Player's fixed Y position (top edge of the player box), relative to the
  // measured game area — recomputed whenever the area's height changes.
  const playerY = gameAreaHeight - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;

  // Which lane the player is currently in (0 = left, 1 = middle, 2 = right)
  const [playerLane, setPlayerLane] = useState<number>(1);
  // Ref mirror of playerLane, read by the game tick loop below. Using a ref
  // here (instead of reading `playerLane` directly from the closure) means
  // the tick loop's setInterval never has to be torn down and recreated
  // when the player changes lanes — see the game loop effect for why that
  // mattered.
  const playerLaneRef = useRef<number>(playerLane);
  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  // Tracks the last horizontal swipe direction so the ninja sprite can
  // face the way it's moving (mirrored via scaleX).
  const [facingRight, setFacingRight] = useState<boolean>(true);

  // All obstacles and power-ups currently on screen
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // Score, increases every tick while alive
  const [score, setScore] = useState<number>(0);
  // Ref mirror of score, read once at game-over time to update highScore
  // without needing `score` in that effect's dependency array.
  const scoreRef = useRef<number>(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // All-time best score reached this session. Drives getStartingFallSpeed()
  // so future runs start a little faster the better you've done before.
  const [highScore, setHighScore] = useState<number>(0);

  // Whether the player has crashed
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Record the high score the moment a run ends.
  useEffect(() => {
    if (gameOver) {
      setHighScore((prev) => Math.max(prev, scoreRef.current));
    }
  }, [gameOver]);

  // The active power-up question, or null when none is showing. Non-null
  // pauses the run (obstacles/power-ups freeze, score stops climbing).
  const [activeQuestion, setActiveQuestion] = useState<PowerUpQuestion | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [questionAnswerState, setQuestionAnswerState] =
    useState<QuestionAnswerState>("idle");

  // Which frame of the ninja run-cycle is currently showing. Cycles through
  // NINJA_RUN_FRAMES on a timer, pausing whenever the run itself is paused
  // (game over or a power-up question is on screen) so the sprite doesn't
  // keep "running in place" behind an overlay.
  const [ninjaFrame, setNinjaFrame] = useState(0);

  useEffect(() => {
    if (gameOver || activeQuestion) return;

    const animation = setInterval(() => {
      setNinjaFrame((prev) => (prev + 1) % NINJA_RUN_FRAMES.length);
    }, NINJA_FRAME_INTERVAL_MS);

    return () => clearInterval(animation);
  }, [gameOver, activeQuestion]);

  // Dash state — isDashing gates which sprite/trail renders and whether the
  // player is currently immune to obstacle collisions; dashFrame drives the
  // one-shot 3-frame dash animation while it's true.
  const [isDashing, setIsDashing] = useState(false);
  const [dashFrame, setDashFrame] = useState(0);

  // Speed increases slowly over time to ramp up difficulty. Starts higher
  // than INITIAL_FALL_SPEED if the player already has a high score from an
  // earlier run this session.
  const fallSpeedRef = useRef<number>(getStartingFallSpeed(0));

  // Used to give each obstacle / power-up a unique id
  const nextObstacleId = useRef<number>(0);
  const nextPowerUpId = useRef<number>(0);

  // Mirrors of the current obstacles/power-ups arrays, read by the spawn
  // placement logic inside the tick loop below.
  const obstaclesRef = useRef<Obstacle[]>([]);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const powerUpsRef = useRef<PowerUp[]>([]);
  useEffect(() => {
    powerUpsRef.current = powerUps;
  }, [powerUps]);

  // How long (ms) since an obstacle / power-up last spawned. These count up
  // inside the single game tick below instead of via separate setInterval
  // timers, so obstacle and power-up spawns are decided in one synchronous
  // step each tick and can never race each other into the same lane.
  const obstacleSpawnTimerRef = useRef<number>(0);
  const powerUpSpawnTimerRef = useRef<number>(0);

  // Ref mirrors so interval callbacks (set up once) never read stale state.
  const gameOverRef = useRef<boolean>(false);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const pausedRef = useRef<boolean>(false);
  useEffect(() => {
    pausedRef.current = activeQuestion !== null;
  }, [activeQuestion]);

  const gameAreaHeightRef = useRef<number>(gameAreaHeight);
  useEffect(() => {
    gameAreaHeightRef.current = gameAreaHeight;
  }, [gameAreaHeight]);

  // A single flag the tick loop checks before doing anything — true only
  // while the run should actually be moving. Gated on assetsReady so the
  // game never ticks before every sprite frame is decoded.
  const isRunningRef = useRef<boolean>(false);
  useEffect(() => {
    isRunningRef.current =
      assetsReady && !gameOverRef.current && !pausedRef.current;
  }, [assetsReady, gameOver, activeQuestion]);

  // -------------------------------------------------------------------------
  // Dash system
  // -------------------------------------------------------------------------

  // Ref mirror of isDashing so long-lived closures (the tick loop, the
  // PanResponder created once below) always read the *current* value
  // instead of whatever was captured on the render they were created —
  // same reasoning as gameOverRef / pausedRef above.
  const isDashingRef = useRef<boolean>(false);
  useEffect(() => {
    isDashingRef.current = isDashing;
  }, [isDashing]);

  // Starts a dash: kicks off the one-shot 3-frame dash animation. Called
  // from the left/right lane-swipe handler below. Blocked while already
  // dashing, while the game is over, or while a power-up question is
  // paused — all read from refs so this stays correct no matter when the
  // calling closure was created.
  const startDash = useCallback(() => {
    if (isDashingRef.current || gameOverRef.current || pausedRef.current) {
      return;
    }
    setDashFrame(0);
    setIsDashing(true);
  }, []);

  // Plays dash-1 -> dash-2 -> dash-3 exactly once, then automatically ends
  // the dash. A single interval per dash, always cleaned up — on finishing,
  // on isDashing flipping back to false some other way, or on unmount.
  useEffect(() => {
    if (!isDashing) return;

    setDashFrame(0);
    let frame = 0;

    const dashInterval = setInterval(() => {
      frame += 1;
      if (frame >= NINJA_DASH_FRAMES.length) {
        clearInterval(dashInterval);
        setIsDashing(false);
        setDashFrame(0);
        return;
      }
      setDashFrame(frame);
    }, NINJA_DASH_FRAME_INTERVAL_MS);

    return () => clearInterval(dashInterval);
  }, [isDashing]);

  // A dash in progress should never survive into game-over or into a
  // power-up question overlay — cut it short immediately if either starts.
  useEffect(() => {
    if (gameOver || activeQuestion) {
      setIsDashing(false);
      setDashFrame(0);
    }
  }, [gameOver, activeQuestion]);

  // -------------------------------------------------------------------------
  // Navigation — copied from Quizzy: back to the games tab, or hand off
  // to the shared folder picker (which routes back to this screen after).
  // -------------------------------------------------------------------------
  const handleBack = useCallback(() => {
    router.replace("/(tabs)/game");
  }, [router]);

  const handleChangeFolder = useCallback(() => {
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/SubwaySurfer" },
    });
  }, [router]);

  /**
   * Finds a lane for a new item spawning at `spawnY`, skipping any lane
   * where something in `blockerLists` sits within MIN_SPAWN_GAP of that
   * point, and skipping `excludeLane` outright (used so a power-up and an
   * obstacle spawning on the same tick can't both claim the same lane).
   * Returns null if no lane is currently clear.
   */
  const findClearLane = useCallback(
    (
      spawnY: number,
      blockerLists: { lane: number; y: number }[][],
      excludeLane: number | null,
    ): number | null => {
      for (const lane of shuffleLanes()) {
        if (lane === excludeLane) continue;
        const blocked = blockerLists.some((list) =>
          list.some(
            (item) =>
              item.lane === lane && Math.abs(item.y - spawnY) < MIN_SPAWN_GAP,
          ),
        );
        if (!blocked) return lane;
      }
      return null;
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Game loop: moves obstacles + power-ups down, checks collisions, spawns
  // new ones, and updates score — all in a single tick so spawn placement
  // is decided synchronously and the two types can never overlap or land in
  // the same spot. Fully frozen while `isRunningRef.current` is false (game
  // over or a question is being shown).
  //
  // IMPORTANT: this effect intentionally does NOT depend on `playerLane`.
  // It used to, so that collision checks could read the latest lane — but
  // that meant the *entire* setInterval was torn down and recreated on
  // every single lane change. Since every lane swipe also triggers a dash,
  // that teardown/recreate was happening on every dash, which is exactly
  // what caused the "everything gets slower while dashing" stutter: the
  // whole game loop was briefly restarting mid-dash. Now the loop reads the
  // player's lane from `playerLaneRef` (kept in sync above) instead, so the
  // interval is created once and just keeps ticking — dashing no longer
  // touches it at all.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (!isRunningRef.current) return;

      // Gradually speed up the game the longer you survive, capped at
      // MAX_FALL_SPEED so a very long run never becomes unplayable.
      fallSpeedRef.current = Math.min(
        fallSpeedRef.current + FALL_SPEED_RAMP_PER_TICK,
        MAX_FALL_SPEED,
      );

      // While dashing, obstacles/power-ups move faster to sell the burst of
      // speed. This only affects this tick's movement math — it never
      // touches fallSpeedRef itself, so the normal difficulty ramp-up isn't
      // disturbed once the dash ends.
      const effectiveFallSpeed = isDashingRef.current
        ? fallSpeedRef.current * DASH_SPEED_MULTIPLIER
        : fallSpeedRef.current;

      const currentPlayerY =
        gameAreaHeightRef.current - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;
      const currentPlayerLane = playerLaneRef.current;

      // --- Decide this tick's spawns up front, synchronously, so the two
      // decisions can see each other and never claim the same lane. ---
      obstacleSpawnTimerRef.current += GAME_TICK_MS;
      powerUpSpawnTimerRef.current += GAME_TICK_MS;

      let obstacleSpawnLane: number | null = null;
      let powerUpSpawnLane: number | null = null;

      const wantsObstacleSpawn =
        obstacleSpawnTimerRef.current >= SPAWN_INTERVAL_MS;
      const wantsPowerUpSpawn =
        powerUpSpawnTimerRef.current >= POWER_UP_SPAWN_INTERVAL_MS;

      // Power-ups are rarer, so give them first pick of a clear lane; the
      // obstacle spawn (below) then avoids whichever lane that just took.
      if (wantsPowerUpSpawn) {
        powerUpSpawnTimerRef.current -= POWER_UP_SPAWN_INTERVAL_MS;
        powerUpSpawnLane = findClearLane(
          -POWER_UP_SIZE,
          [obstaclesRef.current, powerUpsRef.current],
          null,
        );
      }

      if (wantsObstacleSpawn) {
        obstacleSpawnTimerRef.current -= SPAWN_INTERVAL_MS;
        obstacleSpawnLane = findClearLane(
          -OBSTACLE_HEIGHT,
          [powerUpsRef.current],
          powerUpSpawnLane,
        );
      }

      // --- Obstacles: falling down, can end the game ---
      setObstacles((prevObstacles) => {
        const updated: Obstacle[] = [];
        let didCollide = false;

        for (const obstacle of prevObstacles) {
          const newY = obstacle.y + effectiveFallSpeed;

          const isInPlayerRow =
            newY + OBSTACLE_HEIGHT >= currentPlayerY &&
            newY <= currentPlayerY + PLAYER_SIZE;
          const isSameLane = obstacle.lane === currentPlayerLane;

          // Dashing grants brief invulnerability — a collision that would
          // normally end the run is ignored while isDashingRef.current is
          // true. Obstacle sizes/positions themselves are untouched.
          if (isInPlayerRow && isSameLane && !isDashingRef.current) {
            didCollide = true;
          }

          if (newY < gameAreaHeightRef.current) {
            updated.push({ ...obstacle, y: newY });
          }
        }

        if (obstacleSpawnLane !== null) {
          updated.push({
            id: nextObstacleId.current++,
            lane: obstacleSpawnLane,
            y: -OBSTACLE_HEIGHT,
          });
        }

        if (didCollide) {
          setGameOver(true);
        }

        return updated;
      });

      // --- Power-ups: falling down, trigger a question when grabbed ---
      setPowerUps((prevPowerUps) => {
        const updated: PowerUp[] = [];
        let grabbedOne = false;

        for (const powerUp of prevPowerUps) {
          const newY = powerUp.y + effectiveFallSpeed;

          const isInPlayerRow =
            newY + POWER_UP_SIZE >= currentPlayerY &&
            newY <= currentPlayerY + PLAYER_SIZE;
          const isSameLane = powerUp.lane === currentPlayerLane;

          if (isInPlayerRow && isSameLane && !grabbedOne) {
            // Grabbed — don't keep it on screen, and stop checking further
            // power-ups this tick (only pop one question at a time).
            grabbedOne = true;
            continue;
          }

          if (newY < gameAreaHeightRef.current) {
            updated.push({ ...powerUp, y: newY });
          }
        }

        if (powerUpSpawnLane !== null) {
          updated.push({
            id: nextPowerUpId.current++,
            lane: powerUpSpawnLane,
            y: -POWER_UP_SIZE,
          });
        }

        if (grabbedOne) {
          setSelectedOption(null);
          setQuestionAnswerState("idle");
          setActiveQuestion(pickRandomQuestion(powerUpQuestions));
        }

        return updated;
      });

      // Increase score while still alive and not paused
      setScore((prevScore) => prevScore + 1);
    }, GAME_TICK_MS);

    return () => clearInterval(tickInterval);
    // playerLane is deliberately NOT a dependency — see the long comment
    // above the effect. Lane is read fresh each tick via playerLaneRef.
    // powerUpQuestions is stable in practice (default or a prop).
    // findClearLane has a stable identity (empty deps) so including it here
    // never causes extra re-subscriptions. isDashingRef/playerLaneRef are
    // refs and intentionally omitted — their .current is always read fresh.
  }, [powerUpQuestions, findClearLane]);

  // -------------------------------------------------------------------------
  // Swipe controls: swipe left/right to change lanes — each lane swipe also
  // triggers a dash (dash animation + trail + brief speed burst + brief
  // invulnerability).
  // -------------------------------------------------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_evt, gestureState) => {
        if (!isRunningRef.current) return;

        const SWIPE_THRESHOLD = 40;

        if (gestureState.dx > SWIPE_THRESHOLD) {
          setFacingRight(true);
          setPlayerLane((prevLane) => clampLane(prevLane + 1));
          startDash();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          setFacingRight(false);
          setPlayerLane((prevLane) => clampLane(prevLane - 1));
          startDash();
        }
      },
    }),
  ).current;

  // -------------------------------------------------------------------------
  // Power-up question handlers
  // -------------------------------------------------------------------------
  const handleSelectOption = useCallback(
    (key: OptionKey) => {
      if (!activeQuestion || questionAnswerState !== "idle") return;

      setSelectedOption(key);
      const isCorrect = key === activeQuestion.correct;
      setQuestionAnswerState(isCorrect ? "correct" : "wrong");

      if (isCorrect) {
        setScore((s) => s + POWER_UP_BONUS_SCORE);
      }
    },
    [activeQuestion, questionAnswerState],
  );

  const handleContinueAfterQuestion = useCallback(() => {
    setActiveQuestion(null);
    setSelectedOption(null);
    setQuestionAnswerState("idle");
  }, []);

  // -------------------------------------------------------------------------
  // Restart the game
  // -------------------------------------------------------------------------
  const handleRestart = useCallback(() => {
    setObstacles([]);
    setPowerUps([]);
    setScore(0);
    setPlayerLane(1);
    setFacingRight(true);
    // Start the new run's speed based on the best score reached so far this
    // session — see HIGH_SCORE_SPEED_BONUS_PER_POINT near the top of the file.
    fallSpeedRef.current = getStartingFallSpeed(highScore);
    obstacleSpawnTimerRef.current = 0;
    powerUpSpawnTimerRef.current = 0;
    setGameOver(false);
    setActiveQuestion(null);
    setSelectedOption(null);
    setQuestionAnswerState("idle");
    setNinjaFrame(0);
    setIsDashing(false);
    setDashFrame(0);
  }, [highScore]);

  // -------------------------------------------------------------------------
  // Top bar — copied from Quizzy: back button on the left, change-folder
  // button on the right.
  // -------------------------------------------------------------------------
  const renderTopBar = () => (
    <View style={styles.topBar}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
        hitSlop={8}
      >
        <Icon name="chevron-left" size={22} color={THEME.textPrimary} />
      </Pressable>

      <Pressable
        onPress={handleChangeFolder}
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
        hitSlop={8}
      >
        <Icon name="folder-outline" size={20} color={THEME.textPrimary} />
      </Pressable>
    </View>
  );

  // -------------------------------------------------------------------------
  // Power-up question option rendering (idle / correct / wrong states)
  // -------------------------------------------------------------------------
  const renderQuestionOption = (key: OptionKey) => {
    if (!activeQuestion) return null;
    const isSelected = selectedOption === key;
    const isCorrectOption = key === activeQuestion.correct;
    const answered =
      questionAnswerState === "correct" || questionAnswerState === "wrong";

    let optionStyle = styles.questionOption;
    if (answered) {
      if (isCorrectOption) {
        optionStyle = {
          ...styles.questionOption,
          ...styles.questionOptionCorrect,
        };
      } else if (isSelected) {
        optionStyle = {
          ...styles.questionOption,
          ...styles.questionOptionWrong,
        };
      } else {
        optionStyle = {
          ...styles.questionOption,
          ...styles.questionOptionDisabled,
        };
      }
    }

    return (
      <Pressable
        key={key}
        onPress={() => handleSelectOption(key)}
        disabled={questionAnswerState !== "idle"}
        style={({ pressed }) => [
          optionStyle,
          pressed &&
            questionAnswerState === "idle" &&
            styles.questionOptionPressed,
        ]}
      >
        <View style={styles.questionOptionLetter}>
          <Text style={styles.questionOptionLetterText}>{key}</Text>
        </View>
        <Text style={styles.questionOptionText}>
          {activeQuestion.options[key]}
        </Text>
        {answered && isCorrectOption && (
          <Icon name="check-bold" size={16} color={THEME.accent} />
        )}
        {answered && isSelected && !isCorrectOption && (
          <Icon name="close-thick" size={16} color={THEME.danger} />
        )}
      </Pressable>
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {!assetsReady && <LoadingOverlay />}
      {renderTopBar()}

      {folderName ? (
        <View style={styles.header}>
          <Text style={styles.folderLabel}>{folderName.toUpperCase()}</Text>
        </View>
      ) : null}

      {/* Game area measures itself so lane math and the player's Y position
          always match the space actually available, and reserves
          `bottomReserve` so nothing sits under the home indicator / nav bar. */}
      <View
        style={[styles.gameArea, { paddingBottom: bottomReserve }]}
        onLayout={(e) => setGameAreaHeight(e.nativeEvent.layout.height)}
        {...panResponder.panHandlers}
      >
        {/* Score display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          {highScore > 0 && (
            <Text style={styles.bestScoreText}>Best: {highScore}</Text>
          )}
        </View>

        {/* Lane dividers, just for visual reference */}
        {Array.from({ length: LANE_COUNT - 1 }).map((_, index) => (
          <View
            key={`divider-${index}`}
            style={[styles.laneDivider, { left: (index + 1) * LANE_WIDTH }]}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <Image
            key={`obstacle-${obstacle.id}`}
            source={OBSTACLE_OBJECT}
            style={[
              styles.obstacle,
              {
                left: getLaneX(obstacle.lane, OBSTACLE_WIDTH),
                top: obstacle.y,
              },
            ]}
            resizeMode="contain"
          />
        ))}

        {/* Power-ups — small circles */}
        {powerUps.map((powerUp) => (
          <Image
            key={`powerup-${powerUp.id}`}
            source={SCROLL_OBJECT}
            style={[
              styles.powerUp,
              {
                left: getLaneX(powerUp.lane, POWER_UP_SIZE),
                top: powerUp.y,
              },
            ]}
            resizeMode="contain"
            fadeDuration={0}
          />
        ))}

        {/* Player — animated ninja sprite. All run and dash frames are
            pre-rendered and stacked; only the active one has opacity: 1.
            This avoids swapping the Image `source` prop every 100ms, which
            causes React Native to re-decode the image each time and
            produces visible blinking/flickering. */}
        <View
          style={[
            styles.playerWrap,
            {
              left: getLaneX(playerLane, PLAYER_SIZE),
              top: playerY,
            },
          ]}
        >
          {/* Dash trail — always mounted, toggled via opacity */}
          <Image
            source={NINJA_DASH_TRAIL}
            style={[styles.dashTrail, { opacity: isDashing ? 1 : 0 }]}
            resizeMode="contain"
            fadeDuration={0}
          />

          {/* Run cycle — 6 frames, only the active one is visible */}
          {NINJA_RUN_FRAMES.map((frame, i) => (
            <Image
              key={`run-${i}`}
              source={frame}
              style={[
                styles.playerSprite,
                {
                  transform: [{ scaleX: facingRight ? 1 : -1 }],
                  position: i === 0 ? "relative" : "absolute",
                  opacity: !isDashing && ninjaFrame === i ? 1 : 0,
                },
              ]}
              resizeMode="contain"
              fadeDuration={0}
            />
          ))}

          {/* Dash animation — 3 frames, only the active one is visible */}
          {NINJA_DASH_FRAMES.map((frame, i) => (
            <Image
              key={`dash-${i}`}
              source={frame}
              style={[
                styles.playerSprite,
                {
                  transform: [{ scaleX: facingRight ? 1 : -1 }],
                  position: "absolute",
                  opacity: isDashing && dashFrame === i ? 1 : 0,
                },
              ]}
              resizeMode="contain"
              fadeDuration={0}
            />
          ))}
        </View>

        {/* Power-up question overlay */}
        {activeQuestion && (
          <View style={styles.questionOverlay}>
            <View style={styles.questionCard}>
              <View style={styles.questionBadge}>
                <Icon name="star" size={14} color={THEME.background} />
                <Text style={styles.questionBadgeText}>POWER-UP!</Text>
              </View>

              <Text style={styles.questionText}>{activeQuestion.question}</Text>

              <View style={styles.questionOptionsList}>
                {OPTION_KEYS.map(renderQuestionOption)}
              </View>

              {questionAnswerState !== "idle" && (
                <>
                  <Text
                    style={[
                      styles.questionFeedback,
                      questionAnswerState === "correct" && {
                        color: THEME.accent,
                      },
                      questionAnswerState === "wrong" && {
                        color: THEME.danger,
                      },
                    ]}
                  >
                    {questionAnswerState === "correct" &&
                      `Correct! +${POWER_UP_BONUS_SCORE} score`}
                    {questionAnswerState === "wrong" && "Not quite!"}
                  </Text>
                  <Pressable
                    style={styles.continueButton}
                    onPress={handleContinueAfterQuestion}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverCard}>
              <Text style={styles.gameOverText}>Game Over</Text>
              <Text style={styles.finalScoreText}>Final Score: {score}</Text>
              {highScore > 0 && (
                <Text style={styles.bestScoreCardText}>Best: {highScore}</Text>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.restartButton,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleRestart}
              >
                <Text style={styles.restartButtonText}>Restart</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Screen wrapper — reads folderId/folderName from the route, same pattern
// as QuizzyScreen, so both games can be launched the same way.
// ---------------------------------------------------------------------------

export const SubwaySurferScreen: React.FC = () => {
  const { folderId, folderName } = useLocalSearchParams<{
    folderId: string;
    folderName: string;
  }>();

  return (
    <SubwaySurferGame
      key={folderId}
      folderId={folderId}
      folderName={folderName}
    />
  );
};

// ---------------------------------------------------------------------------
// Styles — Spacia dark green theme
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarButtonPressed: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  header: { alignItems: "center", marginTop: 8 },
  folderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.accent,
    letterSpacing: 1.5,
  },
  gameArea: {
    flex: 1,
    backgroundColor: THEME.background,
    overflow: "hidden",
  },
  scoreContainer: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: THEME.surface,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
    alignItems: "center",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.accent,
    letterSpacing: 0.3,
  },
  bestScoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.textSecondary,
    marginTop: 2,
  },
  laneDivider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: THEME.divider,
  },
  playerWrap: {
    position: "absolute",
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  playerSprite: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  // Rendered behind the ninja (declared first in JSX) only while dashing.
  // Deliberately larger than the ninja (~2x width) and purely decorative —
  // it has no bearing on collision, lane position, or PLAYER_SIZE.
  dashTrail: {
    position: "absolute",
    width: 140,
    height: 90,
  },
  obstacle: {
    position: "absolute",
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
  },
  powerUp: {
    position: "absolute",
    width: POWER_UP_SIZE,
    height: POWER_UP_SIZE,
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverCard: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.divider,
    width: "78%",
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: "800",
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  finalScoreText: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  bestScoreCardText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.accent,
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.background,
  },
  // --- Power-up question overlay ---
  questionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  questionCard: {
    width: "100%",
    backgroundColor: THEME.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.divider,
    padding: 24,
    alignItems: "center",
  },
  questionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.powerUp,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  questionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: THEME.background,
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  questionOptionsList: { width: "100%", gap: 10 },
  questionOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: THEME.divider,
    backgroundColor: THEME.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  questionOptionPressed: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  questionOptionCorrect: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  questionOptionWrong: {
    borderColor: THEME.danger,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
  },
  questionOptionDisabled: { opacity: 0.45 },
  questionOptionLetter: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  questionOptionLetterText: {
    color: THEME.textPrimary,
    fontWeight: "800",
    fontSize: 12,
  },
  questionOptionText: {
    color: THEME.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    flex: 1,
  },
  questionFeedback: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: "700",
    color: THEME.textSecondary,
  },
  continueButton: {
    marginTop: 14,
    backgroundColor: THEME.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 14,
  },
  continueButtonText: {
    color: THEME.background,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
