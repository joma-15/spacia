/**
 * SubwaySurferGame.tsx
 *
 * A simplified "Subway Surfers" style endless-runner built with plain
 * React Native Views (boxes) — no images, no game engine libraries — except
 * for the player, which now renders as an animated ninja sprite (4-frame
 * run cycle) instead of a plain colored box.
 *
 * Theme: Spacia's dark green design system (#0D1F17 background, #34D399
 * accent), matching the app's home screen.
 *
 * Top bar: copied from Quizzy — a back button and a "change folder" button.
 * The whole screen is wrapped in SafeAreaView and also reads
 * useSafeAreaInsets so the game area and score chip never sit under the
 * device's bottom nav bar / home indicator.
 *
 * Power-ups (NEW): small green circles fall down the lanes alongside the
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
 * How it works:
 * - The screen is split into 3 vertical lanes.
 * - The player (an animated ninja sprite) sits near the bottom and can
 *   slide left/right between lanes by swiping.
 * - Obstacles (colored boxes) and power-ups (circles) spawn at the top of
 *   a random lane and fall downward every game "tick".
 * - If an obstacle reaches the player's row while in the same lane,
 *   it's a collision -> Game Over.
 * - If a power-up reaches the player's row in the same lane, it's
 *   collected -> the run pauses and a question pops up.
 * - Score increases automatically the longer you survive.
 *
 * Everything runs off a single game loop (setInterval) that updates
 * obstacle/power-up positions, checks collisions, and spawns new ones.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Pressable,
  Image,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// ---------------------------------------------------------------------------
// Spacia theme tokens — mirrors the shared THEME object used across the app
// ---------------------------------------------------------------------------

const THEME = {
  background: '#0D1F17',
  surface: '#16281F', // card surface, slightly lighter than bg
  surfaceAlt: '#1C2F25', // secondary card / divider surface
  accent: '#34D399', // primary green accent (player, buttons, highlights)
  accentDim: 'rgba(52, 211, 153, 0.18)', // soft accent fill
  obstacle: '#2E4237', // muted card-like obstacle color
  obstacleBorder: 'rgba(52, 211, 153, 0.25)',
  powerUp: '#FBBF24', // gold, so it reads distinctly from obstacles
  powerUpGlow: 'rgba(251, 191, 36, 0.35)',
  danger: '#F87171',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  overlay: 'rgba(13, 31, 23, 0.85)',
  divider: 'rgba(255, 255, 255, 0.08)',
};

// ---------------------------------------------------------------------------
// Constants — tweak these to change game feel
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LANE_COUNT = 3;
const LANE_WIDTH = SCREEN_WIDTH / LANE_COUNT;

const PLAYER_SIZE = 50;
const PLAYER_BOTTOM_OFFSET = 100; // distance from bottom of the game area

const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;

// Frames for the ninja while moving — swapped through in sequence to
// produce a running animation for the player sprite.
const NINJA_RUN_FRAMES = [
  require('../../assets/game/ninja/ninja-run-1.png'),
  require('../../assets/game/ninja/ninja-run-2.png'),
  require('../../assets/game/ninja/ninja-run-3.png'),
  require('../../assets/game/ninja/ninja-run-4.png'),
];
const NINJA_FRAME_INTERVAL_MS = 100; // how fast the run cycle animates

const POWER_UP_SIZE = 36; // small circle, deliberately smaller than obstacles

const GAME_TICK_MS = 16; // ~60fps
const INITIAL_FALL_SPEED = 5; // pixels per tick
const SPAWN_INTERVAL_MS = 1200; // how often a new obstacle appears
const POWER_UP_SPAWN_INTERVAL_MS = 4500; // how often a power-up appears
const POWER_UP_BONUS_SCORE = 50; // score bonus for a correct answer
const MIN_SPAWN_GAP = 250; // minimum vertical clearance an obstacle or
// power-up must have from anything else already in its lane before it's
// allowed to spawn there, so the two never land on the same spot or overlap

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

type OptionKey = 'A' | 'B' | 'C';

interface PowerUpQuestion {
  question: string;
  options: Record<OptionKey, string>;
  correct: OptionKey;
}

type QuestionAnswerState = 'idle' | 'correct' | 'wrong';

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

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C'];

// Placeholder question bank — replace with real content as needed.
const DEFAULT_POWER_UP_QUESTIONS: PowerUpQuestion[] = [
  {
    question: 'What is the capital of the Philippines?',
    options: { A: 'Cebu City', B: 'Manila', C: 'Davao City' },
    correct: 'B',
  },
  {
    question: 'Which planet is known as the Red Planet?',
    options: { A: 'Venus', B: 'Jupiter', C: 'Mars' },
    correct: 'C',
  },
  {
    question: 'What is 7 x 8?',
    options: { A: '54', B: '56', C: '64' },
    correct: 'B',
  },
  {
    question: 'Which gas do plants absorb from the air?',
    options: { A: 'Oxygen', B: 'Nitrogen', C: 'Carbon dioxide' },
    correct: 'C',
  },
  {
    question: 'How many sides does a hexagon have?',
    options: { A: '5', B: '6', C: '7' },
    correct: 'B',
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
  // Tracks the last horizontal swipe direction so the ninja sprite can
  // face the way it's moving (mirrored via scaleX).
  const [facingRight, setFacingRight] = useState<boolean>(true);

  // All obstacles and power-ups currently on screen
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // Score, increases every tick while alive
  const [score, setScore] = useState<number>(0);

  // Whether the player has crashed
  const [gameOver, setGameOver] = useState<boolean>(false);

  // The active power-up question, or null when none is showing. Non-null
  // pauses the run (obstacles/power-ups freeze, score stops climbing).
  const [activeQuestion, setActiveQuestion] = useState<PowerUpQuestion | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [questionAnswerState, setQuestionAnswerState] =
    useState<QuestionAnswerState>('idle');

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

  // Speed increases slowly over time to ramp up difficulty
  const fallSpeedRef = useRef<number>(INITIAL_FALL_SPEED);

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
  // while the run should actually be moving.
  const isRunningRef = useRef<boolean>(true);
  useEffect(() => {
    isRunningRef.current = !gameOverRef.current && !pausedRef.current;
  }, [gameOver, activeQuestion]);

  // -------------------------------------------------------------------------
  // Navigation — copied from Quizzy: back to the games tab, or hand off
  // to the shared folder picker (which routes back to this screen after).
  // -------------------------------------------------------------------------
  const handleBack = useCallback(() => {
    router.replace('/(tabs)/game');
  }, [router]);

  const handleChangeFolder = useCallback(() => {
    router.navigate({
      pathname: '/games/SelectionWizard',
      params: { gameRoute: '/games/SubwaySurfer' },
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
  // -------------------------------------------------------------------------
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (!isRunningRef.current) return;

      // Gradually speed up the game the longer you survive
      fallSpeedRef.current += 0.002;

      const currentPlayerY =
        gameAreaHeightRef.current - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;

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
          const newY = obstacle.y + fallSpeedRef.current;

          const isInPlayerRow =
            newY + OBSTACLE_HEIGHT >= currentPlayerY &&
            newY <= currentPlayerY + PLAYER_SIZE;
          const isSameLane = obstacle.lane === playerLane;

          if (isInPlayerRow && isSameLane) {
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
          const newY = powerUp.y + fallSpeedRef.current;

          const isInPlayerRow =
            newY + POWER_UP_SIZE >= currentPlayerY &&
            newY <= currentPlayerY + PLAYER_SIZE;
          const isSameLane = powerUp.lane === playerLane;

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
          setQuestionAnswerState('idle');
          setActiveQuestion(pickRandomQuestion(powerUpQuestions));
        }

        return updated;
      });

      // Increase score while still alive and not paused
      setScore((prevScore) => prevScore + 1);
    }, GAME_TICK_MS);

    return () => clearInterval(tickInterval);
    // playerLane is read fresh each tick via the state setter callbacks
    // above, but we still depend on it so collision checks use the latest
    // lane. powerUpQuestions is stable in practice (default or a prop).
    // findClearLane has a stable identity (empty deps) so including it here
    // never causes extra re-subscriptions.
  }, [playerLane, powerUpQuestions, findClearLane]);

  // -------------------------------------------------------------------------
  // Swipe controls: swipe left/right to change lanes
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
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          setFacingRight(false);
          setPlayerLane((prevLane) => clampLane(prevLane - 1));
        }
      },
    })
  ).current;

  // -------------------------------------------------------------------------
  // Power-up question handlers
  // -------------------------------------------------------------------------
  const handleSelectOption = useCallback(
    (key: OptionKey) => {
      if (!activeQuestion || questionAnswerState !== 'idle') return;

      setSelectedOption(key);
      const isCorrect = key === activeQuestion.correct;
      setQuestionAnswerState(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        setScore((s) => s + POWER_UP_BONUS_SCORE);
      }
    },
    [activeQuestion, questionAnswerState],
  );

  const handleContinueAfterQuestion = useCallback(() => {
    setActiveQuestion(null);
    setSelectedOption(null);
    setQuestionAnswerState('idle');
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
    fallSpeedRef.current = INITIAL_FALL_SPEED;
    obstacleSpawnTimerRef.current = 0;
    powerUpSpawnTimerRef.current = 0;
    setGameOver(false);
    setActiveQuestion(null);
    setSelectedOption(null);
    setQuestionAnswerState('idle');
    setNinjaFrame(0);
  }, []);

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
      questionAnswerState === 'correct' || questionAnswerState === 'wrong';

    let optionStyle = styles.questionOption;
    if (answered) {
      if (isCorrectOption) {
        optionStyle = { ...styles.questionOption, ...styles.questionOptionCorrect };
      } else if (isSelected) {
        optionStyle = { ...styles.questionOption, ...styles.questionOptionWrong };
      } else {
        optionStyle = { ...styles.questionOption, ...styles.questionOptionDisabled };
      }
    }

    return (
      <Pressable
        key={key}
        onPress={() => handleSelectOption(key)}
        disabled={questionAnswerState !== 'idle'}
        style={({ pressed }) => [
          optionStyle,
          pressed && questionAnswerState === 'idle' && styles.questionOptionPressed,
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
          <View
            key={`obstacle-${obstacle.id}`}
            style={[
              styles.obstacle,
              {
                left: getLaneX(obstacle.lane, OBSTACLE_WIDTH),
                top: obstacle.y,
              },
            ]}
          />
        ))}

        {/* Power-ups — small circles */}
        {powerUps.map((powerUp) => (
          <View
            key={`powerup-${powerUp.id}`}
            style={[
              styles.powerUp,
              {
                left: getLaneX(powerUp.lane, POWER_UP_SIZE),
                top: powerUp.y,
              },
            ]}
          >
            <Icon name="star" size={16} color={THEME.background} />
          </View>
        ))}

        {/* Player — animated ninja sprite, cycling through NINJA_RUN_FRAMES
            while the run is active, and mirrored to face the last swipe
            direction. */}
        <View
          style={[
            styles.playerWrap,
            {
              left: getLaneX(playerLane, PLAYER_SIZE),
              top: playerY,
            },
          ]}
        >
          <Image
            source={NINJA_RUN_FRAMES[ninjaFrame]}
            style={[
              styles.playerSprite,
              { transform: [{ scaleX: facingRight ? 1 : -1 }] },
            ]}
            resizeMode="contain"
          />
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

              {questionAnswerState !== 'idle' && (
                <>
                  <Text
                    style={[
                      styles.questionFeedback,
                      questionAnswerState === 'correct' && {
                        color: THEME.accent,
                      },
                      questionAnswerState === 'wrong' && {
                        color: THEME.danger,
                      },
                    ]}
                  >
                    {questionAnswerState === 'correct' &&
                      `Correct! +${POWER_UP_BONUS_SCORE} score`}
                    {questionAnswerState === 'wrong' && 'Not quite!'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarButtonPressed: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  header: { alignItems: 'center', marginTop: 8 },
  folderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accent,
    letterSpacing: 1.5,
  },
  gameArea: {
    flex: 1,
    backgroundColor: THEME.background,
    overflow: 'hidden',
  },
  scoreContainer: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: THEME.surface,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.accent,
    letterSpacing: 0.3,
  },
  laneDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: THEME.divider,
  },
  playerWrap: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSprite: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  obstacle: {
    position: 'absolute',
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    backgroundColor: THEME.obstacle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.obstacleBorder,
  },
  powerUp: {
    position: 'absolute',
    width: POWER_UP_SIZE,
    height: POWER_UP_SIZE,
    borderRadius: POWER_UP_SIZE / 2,
    backgroundColor: THEME.powerUp,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.powerUp,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverCard: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.divider,
    width: '78%',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  finalScoreText: {
    fontSize: 16,
    color: THEME.textSecondary,
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
    fontWeight: '700',
    color: THEME.background,
  },
  // --- Power-up question overlay ---
  questionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  questionCard: {
    width: '100%',
    backgroundColor: THEME.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.divider,
    padding: 24,
    alignItems: 'center',
  },
  questionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.powerUp,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  questionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.background,
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  questionOptionsList: { width: '100%', gap: 10 },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  questionOptionDisabled: { opacity: 0.45 },
  questionOptionLetter: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionOptionLetterText: {
    color: THEME.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  questionOptionText: {
    color: THEME.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    flex: 1,
  },
  questionFeedback: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});