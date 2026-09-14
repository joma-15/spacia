/**
 * SubwaySurferGame.tsx
 *
 * A simplified "Subway Surfers" style endless-runner built with plain
 * React Native Views (boxes) — no images, no game engine libraries.
 *
 * Theme: Spacia's dark green design system (#0D1F17 background, #34D399
 * accent), matching the app's home screen.
 *
 * Top bar: copied from Quizzy — a back button and a "change folder" button,
 * same icons/behavior. The whole screen is wrapped in SafeAreaView and also
 * reads useSafeAreaInsets so the game area and bottom score chip never sit
 * under the device's bottom nav bar / home indicator.
 *
 * How it works:
 * - The screen is split into 3 vertical lanes.
 * - The player (a colored box) sits near the bottom and can slide
 *   left/right between lanes by swiping.
 * - Obstacles (colored boxes) spawn at the top of a random lane and
 *   fall downward every game "tick".
 * - If an obstacle reaches the player's row while in the same lane,
 *   it's a collision -> Game Over.
 * - Score increases automatically the longer you survive.
 *
 * Everything runs off a single game loop (setInterval) that updates
 * obstacle positions, checks collisions, and spawns new obstacles.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Pressable,
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

const GAME_TICK_MS = 16; // ~60fps
const INITIAL_FALL_SPEED = 5; // pixels per tick
const SPAWN_INTERVAL_MS = 1200; // how often a new obstacle appears

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single obstacle box falling down a lane. */
interface Obstacle {
  id: number;
  lane: number; // 0, 1, or 2
  y: number; // current vertical position (top edge)
}

interface SubwaySurferGameProps {
  /** Optional — only needed if this instance is being driven by a specific folder context. */
  folderId?: string;
  folderName?: string;
}

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SubwaySurferGame({
  folderName,
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

  // All obstacles currently on screen
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Score, increases every tick while alive
  const [score, setScore] = useState<number>(0);

  // Whether the player has crashed
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Speed increases slowly over time to ramp up difficulty
  const fallSpeedRef = useRef<number>(INITIAL_FALL_SPEED);

  // Used to give each obstacle a unique id
  const nextObstacleId = useRef<number>(0);

  // Keep a ref mirror of gameOver so the interval callbacks (which are set
  // up once) can check the latest value without stale closures.
  const gameOverRef = useRef<boolean>(false);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Keep a ref mirror of the measured game area height for the same reason.
  const gameAreaHeightRef = useRef<number>(gameAreaHeight);
  useEffect(() => {
    gameAreaHeightRef.current = gameAreaHeight;
  }, [gameAreaHeight]);

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

  // -------------------------------------------------------------------------
  // Game loop: moves obstacles down, checks collisions, updates score
  // -------------------------------------------------------------------------
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (gameOverRef.current) return;

      // Gradually speed up the game the longer you survive
      fallSpeedRef.current += 0.002;

      const currentPlayerY =
        gameAreaHeightRef.current - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;

      setObstacles((prevObstacles) => {
        const updated: Obstacle[] = [];
        let didCollide = false;

        for (const obstacle of prevObstacles) {
          const newY = obstacle.y + fallSpeedRef.current;

          // Check collision: obstacle overlaps the player's row AND lane
          const isInPlayerRow =
            newY + OBSTACLE_HEIGHT >= currentPlayerY &&
            newY <= currentPlayerY + PLAYER_SIZE;
          const isSameLane = obstacle.lane === playerLane;

          if (isInPlayerRow && isSameLane) {
            didCollide = true;
          }

          // Keep obstacle only if it's still on screen
          if (newY < gameAreaHeightRef.current) {
            updated.push({ ...obstacle, y: newY });
          }
        }

        if (didCollide) {
          setGameOver(true);
        }

        return updated;
      });

      // Increase score while still alive
      setScore((prevScore) => (gameOverRef.current ? prevScore : prevScore + 1));
    }, GAME_TICK_MS);

    return () => clearInterval(tickInterval);
    // playerLane is read fresh each tick via the state setter callback above,
    // but we still depend on it so collision checks use the latest lane.
  }, [playerLane]);

  // -------------------------------------------------------------------------
  // Spawning: adds a new obstacle in a random lane every SPAWN_INTERVAL_MS
  // -------------------------------------------------------------------------
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (gameOverRef.current) return;

      const randomLane = Math.floor(Math.random() * LANE_COUNT);
      const newObstacle: Obstacle = {
        id: nextObstacleId.current++,
        lane: randomLane,
        y: -OBSTACLE_HEIGHT, // start just above the game area
      };

      setObstacles((prev) => [...prev, newObstacle]);
    }, SPAWN_INTERVAL_MS);

    return () => clearInterval(spawnInterval);
  }, []);

  // -------------------------------------------------------------------------
  // Swipe controls: swipe left/right to change lanes
  // -------------------------------------------------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_evt, gestureState) => {
        if (gameOverRef.current) return;

        const SWIPE_THRESHOLD = 40;

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swiped right
          setPlayerLane((prevLane) => clampLane(prevLane + 1));
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped left
          setPlayerLane((prevLane) => clampLane(prevLane - 1));
        }
      },
    })
  ).current;

  // -------------------------------------------------------------------------
  // Restart the game
  // -------------------------------------------------------------------------
  const handleRestart = useCallback(() => {
    setObstacles([]);
    setScore(0);
    setPlayerLane(1);
    fallSpeedRef.current = INITIAL_FALL_SPEED;
    setGameOver(false);
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
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
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
            style={[
              styles.laneDivider,
              { left: (index + 1) * LANE_WIDTH },
            ]}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <View
            key={obstacle.id}
            style={[
              styles.obstacle,
              {
                left: getLaneX(obstacle.lane, OBSTACLE_WIDTH),
                top: obstacle.y,
              },
            ]}
          />
        ))}

        {/* Player */}
        <View
          style={[
            styles.player,
            {
              left: getLaneX(playerLane, PLAYER_SIZE),
              top: playerY,
            },
          ]}
        />

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
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: THEME.accent,
    borderRadius: 14,
    shadowColor: THEME.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
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
});