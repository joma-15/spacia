/**
 * SubwaySurferGame.tsx
 *
 * A simplified "Subway Surfers" style endless-runner built with plain
 * React Native Views (boxes) — no images, no game engine libraries.
 *
 * Restyled to match the Spacia app's dark-green design system:
 * background #0D1F17, accent #34D399, rounded "card" surfaces, and
 * translucent overlays instead of flat arcade colors.
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
  TouchableOpacity,
} from 'react-native';

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
const PLAYER_BOTTOM_OFFSET = 100; // distance from bottom of screen

const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;

const GAME_TICK_MS = 16; // ~60fps
const INITIAL_FALL_SPEED = 5; // pixels per tick
const SPAWN_INTERVAL_MS = 1200; // how often a new obstacle appears

// Player's fixed Y position (top edge of the player box)
const PLAYER_Y = SCREEN_HEIGHT - PLAYER_BOTTOM_OFFSET - PLAYER_SIZE;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single obstacle box falling down a lane. */
interface Obstacle {
  id: number;
  lane: number; // 0, 1, or 2
  y: number; // current vertical position (top edge)
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

export default function SubwaySurferGame() {
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

  // -------------------------------------------------------------------------
  // Game loop: moves obstacles down, checks collisions, updates score
  // -------------------------------------------------------------------------
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (gameOverRef.current) return;

      // Gradually speed up the game the longer you survive
      fallSpeedRef.current += 0.002;

      setObstacles((prevObstacles) => {
        const updated: Obstacle[] = [];
        let didCollide = false;

        for (const obstacle of prevObstacles) {
          const newY = obstacle.y + fallSpeedRef.current;

          // Check collision: obstacle overlaps the player's row AND lane
          const isInPlayerRow =
            newY + OBSTACLE_HEIGHT >= PLAYER_Y &&
            newY <= PLAYER_Y + PLAYER_SIZE;
          const isSameLane = obstacle.lane === playerLane;

          if (isInPlayerRow && isSameLane) {
            didCollide = true;
          }

          // Keep obstacle only if it's still on screen
          if (newY < SCREEN_HEIGHT) {
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
        y: -OBSTACLE_HEIGHT, // start just above the screen
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
  // Render
  // -------------------------------------------------------------------------
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
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
            top: PLAYER_Y,
          },
        ]}
      />

      {/* Game over overlay */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.finalScoreText}>Final Score: {score}</Text>
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestart}
              activeOpacity={0.85}
            >
              <Text style={styles.restartButtonText}>Restart</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — Spacia dark green theme
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    overflow: 'hidden',
  },
  scoreContainer: {
    position: 'absolute',
    top: 40,
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