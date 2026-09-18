/**
 * NinjaRush.tsx
 *
 * A fast-paced endless-runner built with React Native Views and sprite animations.
 * Theme: Spacia's dark green design system (#0D1F17 background, #34D399 accent).
 *
 * SYNC MODEL:
 *  - Questions and answers are dynamically built from the selected study folder's
 *    real flashcards (loaded offline-first from SQLite, synced in background).
 *  - Answering a question during gameplay updates SQLite status locally
 *    immediately (safe to call with zero network latency).
 *  - Understood cards are accumulated in `pendingUnderstoodRef`.
 *  - Batched sync: One `PATCH /flashcards/batch-status` request is sent with all
 *    understood card IDs when the game ends (Game Over), when the user taps Back,
 *    when the user changes folders, or when leaving the screen.
 *  - If no cards were understood, no network request is made.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAssetPreload } from "./hooks/useAssetPreload";
import LoadingOverlay from "./components/LoadingOverlay";
import { useFlashcardSync } from "./hooks/useFlashcardSync";
import { FlashCard } from "@/features/flashcards/types";

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

// Sprite for obstacle
const OBSTACLE_OBJECT = require("@/assets/images/obstacle1.png");

// Sprite for scroll (power-up)
const SCROLL_OBJECT = require("@/assets/images/scroll1.png");

// Frames for the ninja while moving
const NINJA_RUN_FRAMES = [
  require("../../../../assets/images/ninja-run-1.png"),
  require("../../../../assets/images/ninja-run-2.png"),
  require("../../../../assets/images/ninja-run-3.png"),
  require("../../../../assets/images/ninja-run-4.png"),
  require("../../../../assets/images/ninja-run-5.png"),
  require("../../../../assets/images/ninja-run-6.png"),
];
const NINJA_FRAME_INTERVAL_MS = 100;

// Dash — one-shot 3-frame animation
const NINJA_DASH_FRAMES = [
  require("../../../../assets/images/ninja-dash-1.png"),
  require("../../../../assets/images/ninja-dash-2.png"),
  require("../../../../assets/images/ninja-dash-3.png"),
];
const NINJA_DASH_FRAME_INTERVAL_MS = 60;
const NINJA_DASH_TRAIL = require("../../../../assets/images/ninja-dash-trail.png");

const POWER_UP_SIZE = 70;

const GAME_TICK_MS = 16; // ~60fps
const SCORE_INTERVAL_MS = 100;
const POWER_UP_SPAWN_INTERVAL_MS = 8000; // how often a power-up appears
const POWER_UP_BONUS_SCORE = 50; // score bonus for a correct answer
const MIN_SPAWN_GAP = 250;

const INITIAL_SPAWN_INTERVAL_MS = 1000;
const MIN_SPAWN_INTERVAL_MS = 450;

const INITIAL_FALL_SPEED = 5;
const MAX_FALL_SPEED = 20;

const HIGH_SCORE_SPEED_BONUS_PER_POINT = 0.0008;
const MAX_HIGH_SCORE_SPEED_BONUS = 6;

function getStartingFallSpeed(bestScore: number): number {
  const highScoreBonus = Math.min(
    bestScore * HIGH_SCORE_SPEED_BONUS_PER_POINT,
    MAX_HIGH_SCORE_SPEED_BONUS,
  );
  return INITIAL_FALL_SPEED + highScoreBonus;
}

const getDifficulty = (score: number) => {
  const level = Math.floor(score / 100);
  const fallSpeed = Math.min(INITIAL_FALL_SPEED + level * 0.5, MAX_FALL_SPEED);
  const spawnInterval = Math.max(
    INITIAL_SPAWN_INTERVAL_MS - level * 80,
    MIN_SPAWN_INTERVAL_MS,
  );
  return { fallSpeed, spawnInterval };
};

// ---------------------------------------------------------------------------
// Types & Helpers for Questions
// ---------------------------------------------------------------------------

export type OptionKey = "A" | "B" | "C";
export const OPTION_KEYS: OptionKey[] = ["A", "B", "C"];

export interface NinjaPowerUpQuestion {
  id: string; // flashcard id
  question: string;
  options: Record<OptionKey, string>;
  correct: OptionKey;
}

interface Obstacle {
  id: number;
  lane: number;
  y: number;
}

interface PowerUp {
  id: number;
  lane: number;
  y: number;
}

type QuestionAnswerState = "idle" | "correct" | "wrong";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds multiple-choice questions from flashcards for the power-up scrolls.
 * The correct option is the card's answer; 2 distractors are pulled from other
 * cards in the folder.
 */
export function buildPowerUpQuestions(cards: FlashCard[]): NinjaPowerUpQuestion[] {
  if (cards.length === 0) return [];

  const allAnswers = cards.map((c) => c.answer);

  return cards.map((card) => {
    const otherAnswers = cards
      .map((c, idx) => ({ id: c.id, answer: allAnswers[idx] }))
      .filter((c) => c.id !== card.id && c.answer !== card.answer)
      .map((c) => c.answer);

    let distractorPool = shuffle(Array.from(new Set(otherAnswers)));

    if (distractorPool.length === 0) {
      distractorPool = ["None of the above", "Not applicable"];
    } else if (distractorPool.length < 2) {
      const filled: string[] = [];
      while (filled.length < 2) {
        filled.push(distractorPool[filled.length % distractorPool.length]);
      }
      distractorPool = filled;
    }

    const distractors = distractorPool.slice(0, 2);
    const shuffledOptions = shuffle([card.answer, ...distractors]);

    const options = {} as Record<OptionKey, string>;
    let correct: OptionKey = "A";
    OPTION_KEYS.forEach((key, i) => {
      options[key] = shuffledOptions[i];
      if (shuffledOptions[i] === card.answer) correct = key;
    });

    return { id: card.id, question: card.question, options, correct };
  });
}

function getLaneX(lane: number, boxWidth: number): number {
  const laneCenter = lane * LANE_WIDTH + LANE_WIDTH / 2;
  return laneCenter - boxWidth / 2;
}

function clampLane(lane: number): number {
  if (lane < 0) return 0;
  if (lane > LANE_COUNT - 1) return LANE_COUNT - 1;
  return lane;
}

function shuffleLanes(): number[] {
  const lanes = Array.from({ length: LANE_COUNT }, (_, i) => i);
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes;
}

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

interface NinjaRushGameProps {
  folderName?: string;
  questions: NinjaPowerUpQuestion[];
  onAnswer: (cardId: string, correct: boolean) => void;
  onGameOver: () => void;
  onBack: () => void;
  onChangeFolder: () => void;
  onRestart?: () => void;
}

function NinjaRushGame({
  folderName,
  questions,
  onAnswer,
  onGameOver,
  onBack,
  onChangeFolder,
  onRestart,
}: NinjaRushGameProps) {
  const insets = useSafeAreaInsets();
  const assetsReady = useAssetPreload();

  const [gameAreaHeight, setGameAreaHeight] = useState<number>(
    SCREEN_HEIGHT - 160,
  );
  const bottomReserve = Math.max(insets.bottom, 12) + 12;
  const playerY = gameAreaHeight - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;

  const [playerLane, setPlayerLane] = useState<number>(1);
  const playerLaneRef = useRef<number>(playerLane);
  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  const [facingRight, setFacingRight] = useState<boolean>(true);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const [score, setScore] = useState<number>(0);
  const scoreRef = useRef<number>(0);
  const scoreTimerRef = useRef<number>(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const [highScore, setHighScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  useEffect(() => {
    if (gameOver) {
      setHighScore((prev) => Math.max(prev, scoreRef.current));
      onGameOver();
    }
  }, [gameOver, onGameOver]);

  // Pool of available questions during this run
  const availableQuestionsRef = useRef<NinjaPowerUpQuestion[]>([...questions]);
  useEffect(() => {
    availableQuestionsRef.current = [...questions];
  }, [questions]);

  // Active question overlay
  const [activeQuestion, setActiveQuestion] = useState<NinjaPowerUpQuestion | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [questionAnswerState, setQuestionAnswerState] =
    useState<QuestionAnswerState>("idle");

  const [ninjaFrame, setNinjaFrame] = useState(0);

  useEffect(() => {
    if (gameOver || activeQuestion) return;

    const animation = setInterval(() => {
      setNinjaFrame((prev) => (prev + 1) % NINJA_RUN_FRAMES.length);
    }, NINJA_FRAME_INTERVAL_MS);

    return () => clearInterval(animation);
  }, [gameOver, activeQuestion]);

  const [isDashing, setIsDashing] = useState(false);
  const [dashFrame, setDashFrame] = useState(0);

  const fallSpeedRef = useRef<number>(getStartingFallSpeed(0));
  const nextObstacleId = useRef<number>(0);
  const nextPowerUpId = useRef<number>(0);

  const obstaclesRef = useRef<Obstacle[]>([]);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const powerUpsRef = useRef<PowerUp[]>([]);
  useEffect(() => {
    powerUpsRef.current = powerUps;
  }, [powerUps]);

  const obstacleSpawnTimerRef = useRef<number>(0);
  const powerUpSpawnTimerRef = useRef<number>(0);

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

  const isRunningRef = useRef<boolean>(false);
  useEffect(() => {
    isRunningRef.current =
      assetsReady && !gameOverRef.current && !pausedRef.current;
  }, [assetsReady, gameOver, activeQuestion]);

  const isDashingRef = useRef<boolean>(false);
  useEffect(() => {
    isDashingRef.current = isDashing;
  }, [isDashing]);

  const startDash = useCallback(() => {
    if (isDashingRef.current || gameOverRef.current || pausedRef.current) {
      return;
    }
    setDashFrame(0);
    setIsDashing(true);
  }, []);

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

  useEffect(() => {
    if (gameOver || activeQuestion) {
      setIsDashing(false);
      setDashFrame(0);
    }
  }, [gameOver, activeQuestion]);

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

  // Function to pick the next question from available pool
  const getNextQuestion = useCallback((): NinjaPowerUpQuestion | null => {
    if (availableQuestionsRef.current.length === 0) {
      if (questions.length === 0) return null;
      // Refill from full pool if all were answered during a long run
      availableQuestionsRef.current = [...questions];
    }
    const idx = Math.floor(Math.random() * availableQuestionsRef.current.length);
    return availableQuestionsRef.current[idx];
  }, [questions]);

  // Main game tick loop
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (!isRunningRef.current) return;

      const { fallSpeed, spawnInterval } = getDifficulty(scoreRef.current);
      const effectiveFallSpeed = fallSpeed;

      const currentPlayerY =
        gameAreaHeightRef.current - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;
      const currentPlayerLane = playerLaneRef.current;

      obstacleSpawnTimerRef.current += GAME_TICK_MS;
      powerUpSpawnTimerRef.current += GAME_TICK_MS;

      let obstacleSpawnLane: number | null = null;
      let powerUpSpawnLane: number | null = null;

      const wantsObstacleSpawn = obstacleSpawnTimerRef.current >= spawnInterval;
      const wantsPowerUpSpawn =
        powerUpSpawnTimerRef.current >= POWER_UP_SPAWN_INTERVAL_MS;

      if (wantsPowerUpSpawn) {
        powerUpSpawnTimerRef.current -= POWER_UP_SPAWN_INTERVAL_MS;
        powerUpSpawnLane = findClearLane(
          -POWER_UP_SIZE,
          [obstaclesRef.current, powerUpsRef.current],
          null,
        );
      }

      if (wantsObstacleSpawn) {
        obstacleSpawnTimerRef.current -= spawnInterval;
        obstacleSpawnLane = findClearLane(
          -OBSTACLE_HEIGHT,
          [powerUpsRef.current],
          powerUpSpawnLane,
        );
      }

      // Obstacles loop
      setObstacles((prevObstacles) => {
        const updated: Obstacle[] = [];
        let didCollide = false;

        for (const obstacle of prevObstacles) {
          const newY = obstacle.y + effectiveFallSpeed;

          const isInPlayerRow =
            newY + OBSTACLE_HEIGHT >= currentPlayerY &&
            newY <= currentPlayerY + PLAYER_SIZE;
          const isSameLane = obstacle.lane === currentPlayerLane;

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

      // Power-ups loop
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
          const nextQ = getNextQuestion();
          if (nextQ) {
            setSelectedOption(null);
            setQuestionAnswerState("idle");
            setActiveQuestion(nextQ);
          } else {
            // No questions available, award bonus directly
            setScore((s) => s + POWER_UP_BONUS_SCORE);
          }
        }

        return updated;
      });

      // Score increment
      scoreTimerRef.current += GAME_TICK_MS;
      if (scoreTimerRef.current >= SCORE_INTERVAL_MS) {
        scoreTimerRef.current -= SCORE_INTERVAL_MS;
        setScore((prevScore) => prevScore + 1);
      }
    }, GAME_TICK_MS);

    return () => clearInterval(tickInterval);
  }, [findClearLane, getNextQuestion]);

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

  // Power-up question answer handlers
  const handleSelectOption = useCallback(
    (key: OptionKey) => {
      if (!activeQuestion || questionAnswerState !== "idle") return;

      setSelectedOption(key);
      const isCorrect = key === activeQuestion.correct;
      setQuestionAnswerState(isCorrect ? "correct" : "wrong");

      // Record answer locally (SQLite + React state) and queue for batch sync
      onAnswer(activeQuestion.id, isCorrect);

      if (isCorrect) {
        setScore((s) => s + POWER_UP_BONUS_SCORE);
        // Remove answered card from available pool for this run
        availableQuestionsRef.current = availableQuestionsRef.current.filter(
          (q) => q.id !== activeQuestion.id,
        );
      }
    },
    [activeQuestion, questionAnswerState, onAnswer],
  );

  const handleContinueAfterQuestion = useCallback(() => {
    setActiveQuestion(null);
    setSelectedOption(null);
    setQuestionAnswerState("idle");
  }, []);

  const handleRestart = useCallback(() => {
    setObstacles([]);
    setPowerUps([]);
    setScore(0);
    scoreTimerRef.current = 0;
    setPlayerLane(1);
    setFacingRight(true);
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
    availableQuestionsRef.current = [...questions];
    onRestart?.();
  }, [highScore, questions, onRestart]);

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
        hitSlop={8}
      >
        <Icon name="chevron-left" size={22} color={THEME.textPrimary} />
      </Pressable>

      <Pressable
        onPress={onChangeFolder}
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {!assetsReady && <LoadingOverlay />}
      {renderTopBar()}

      {folderName ? (
        <View style={styles.header}>
          <Text style={styles.folderLabel}>{folderName.toUpperCase()}</Text>
        </View>
      ) : null}

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

        {/* Lane dividers */}
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

        {/* Power-ups — scroll sprite */}
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

        {/* Player sprite */}
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
            source={NINJA_DASH_TRAIL}
            style={[styles.dashTrail, { opacity: isDashing ? 1 : 0 }]}
            resizeMode="contain"
            fadeDuration={0}
          />

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
        </View>z

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
              <View style={styles.gameOverButtonsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.restartButton,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleRestart}
                >
                  <Text style={styles.restartButtonText}>Play Again</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.exitButton,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={onBack}
                >
                  <Text style={styles.exitButtonText}>Exit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Game Content Wrapper: Wires useFlashcardSync and batched results
// ---------------------------------------------------------------------------

const NinjaRushGameContent: React.FC<{
  folderId: string;
  folderName: string;
}> = ({ folderId, folderName }) => {
  const router = useRouter();
  const {
    cards,
    totalCardsCount,
    isDataLoading,
    recordAnswerLocally,
    submitGameResults,
    reloadCards,
  } = useFlashcardSync(folderId);

  // Accumulates understood card IDs during the session
  const pendingUnderstoodRef = useRef<Set<string>>(new Set());
  const isFlushingRef = useRef(false);

  // Generate questions from cards
  const cardsSignature = cards
    .map((c) => `${c.id}:${c.question}:${c.answer}`)
    .join("|");

  const questions = useMemo(
    () => buildPowerUpQuestions(cards),
    [cardsSignature], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Flushes all accumulated understood cards to the backend in a single batch.
   */
  const flushPendingUpdates = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;

    const ids = Array.from(pendingUnderstoodRef.current);
    pendingUnderstoodRef.current.clear();

    if (ids.length === 0) {
      isFlushingRef.current = false;
      return;
    }

    try {
      await submitGameResults(ids);
    } catch (err) {
      console.warn("[NinjaRush] Failed to sync game results:", err);
    } finally {
      isFlushingRef.current = false;
    }
  }, [submitGameResults]);

  // Flush pending updates if user navigates away or switches tabs
  useFocusEffect(
    useCallback(() => {
      return () => {
        void flushPendingUpdates();
      };
    }, [flushPendingUpdates]),
  );

  // Also flush on unmount
  useEffect(() => {
    return () => {
      void flushPendingUpdates();
    };
  }, [flushPendingUpdates]);

  const handleAnswer = useCallback(
    (cardId: string, correct: boolean) => {
      recordAnswerLocally(cardId, correct);
      if (correct) {
        pendingUnderstoodRef.current.add(cardId);
      }
    },
    [recordAnswerLocally],
  );

  const handleGameOver = useCallback(() => {
    void flushPendingUpdates();
  }, [flushPendingUpdates]);

  const handleBack = useCallback(async () => {
    await flushPendingUpdates();
    router.replace("/(tabs)/game");
  }, [flushPendingUpdates, router]);

  const handleChangeFolder = useCallback(async () => {
    await flushPendingUpdates();
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/NinjaRush" },
    });
  }, [flushPendingUpdates, router]);

  const handleRestart = useCallback(async () => {
    await flushPendingUpdates();
    reloadCards();
  }, [flushPendingUpdates, reloadCards]);

  if (isDataLoading) {
    return <LoadingOverlay />;
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} style={styles.topBarButton} hitSlop={8}>
            <Icon name="chevron-left" size={22} color={THEME.textPrimary} />
          </Pressable>
          <Pressable onPress={handleChangeFolder} style={styles.topBarButton} hitSlop={8}>
            <Icon name="folder-outline" size={20} color={THEME.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {totalCardsCount > 0 ? "ALL CARDS MASTERED!" : "NO FLASHCARDS"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {totalCardsCount > 0
              ? "You have already understood all cards in this folder."
              : "This folder does not have any flashcards yet."}
          </Text>
          <Pressable style={styles.primaryButton} onPress={handleChangeFolder}>
            <Text style={styles.primaryButtonText}>CHOOSE ANOTHER FOLDER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NinjaRushGame
      folderName={folderName}
      questions={questions}
      onAnswer={handleAnswer}
      onGameOver={handleGameOver}
      onBack={handleBack}
      onChangeFolder={handleChangeFolder}
      onRestart={handleRestart}
    />
  );
};

// ---------------------------------------------------------------------------
// Screen: Reads folderId & folderName from route params
// ---------------------------------------------------------------------------

export const NinjaRushScreen: React.FC = () => {
  const router = useRouter();
  const { folderId, folderName } = useLocalSearchParams<{
    folderId: string;
    folderName: string;
  }>();

  if (!folderId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace("/(tabs)/game")}
            style={styles.topBarButton}
            hitSlop={8}
          >
            <Icon name="chevron-left" size={22} color={THEME.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>NINJA RUSH</Text>
          <Text style={styles.emptySubtitle}>No folder selected.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.navigate({
                pathname: "/games/SelectionWizard",
                params: { gameRoute: "/games/NinjaRush" },
              })
            }
          >
            <Text style={styles.primaryButtonText}>CHOOSE A FOLDER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NinjaRushGameContent
      key={folderId}
      folderId={folderId}
      folderName={folderName ?? "Ninja Rush"}
    />
  );
};

export default NinjaRushScreen;

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
    width: "82%",
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
  gameOverButtonsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  restartButton: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
  },
  restartButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.background,
  },
  exitButton: {
    backgroundColor: THEME.surfaceAlt,
    borderWidth: 1,
    borderColor: THEME.divider,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
  },
  exitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textSecondary,
  },
  // Power-up question overlay
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
  // Empty & fallback states
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: THEME.background,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
});
