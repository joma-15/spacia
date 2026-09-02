import React, { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Device from "expo-device";

import { SpaceBackgroundProps } from "./types";
import { THEME } from "./colors";
import {
  SHIP_DEFAULT_SIZE,
  HEADER_HEIGHT,
  QUESTION_CARD_HEIGHT,
  QUESTION_CARD_MARGIN,
  NUM_SHOOTING_STAR_SLOTS,
  MIN_FLASHCARDS_REQUIRED,
} from "./constants";
import { generateStars } from "./utils/starField";
import { useSpaceBlastEngine } from "./hooks/useSpaceBlastEngine";

import Star from "./components/Star";
import ShootingStar from "./components/ShootingStar";
import AnswerBubble from "./components/AnswerBubble";
import Bullet from "./components/Bullet";
import Explosion from "./components/Explosion";
import Spaceship from "./components/Spaceship";
import GameHeader from "./components/GameHeader";
import LivesRow from "./components/LivesRow";
import QuestionCard from "./components/QuestionCard";
import MinCardsModal from "./components/MinCardsModal";
import WinModal from "./components/WinModal";
import GameOverModal from "./components/GameOverModal";
import LoadingOverlay from "./components/LoadingOverlay";

/**
 * SpaceBlastScreen's visual half. Given flashcards and a handful of
 * callbacks, this component:
 *  1. Figures out where everything should sit on screen (ship, HUD,
 *     safe zones for the floating answers).
 *  2. Hands that layout info to `useSpaceBlastEngine`, which does all
 *     the actual game-state work.
 *  3. Renders whatever the engine says the current state is.
 *
 * If you're looking for GAME LOGIC (scoring, lives, spawning answers),
 * it lives in `hooks/useSpaceBlastEngine.ts` and its sub-hooks — not
 * here. This file should stay focused on layout and rendering.
 */
const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
  starCount = 80,
  shootingStars = true,
  backgroundColor = THEME.bg,
  style,
  shipSize = SHIP_DEFAULT_SIZE,
  onBack,
  studySets = [],
  currentStudySetId,
  flashcards = [],
  minFlashcards = MIN_FLASHCARDS_REQUIRED,
  onGoToLibrary,
  onAnswer,
  onWin,
  maxLives = 3,
  onGameOver,
  maxBullets = 5,
  fireCooldownMs = 220,
  isDataLoading = false,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isTablet = Device.deviceType === Device.DeviceType.TABLET;

  const stars = useMemo(() => generateStars(starCount), [starCount]);
  const [gameSize, setGameSize] = useState({ width: 0, height: 0 });
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setGameSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
  }, []);

  /* ---------------- Layout math ---------------- */
  // Where does the ship sit, and what's the safe vertical zone floating
  // answers are allowed to drift inside (between the header and the ship)?
  const questionCardBottom = insets.bottom + 16;
  // Use the maximum possible card height (for very long questions) so the
  // ship is always positioned above the card regardless of question length.
  // QuestionCard can grow up to QUESTION_CARD_HEIGHT + 36 (see QuestionCard.tsx).
  const questionCardMaxHeight = QUESTION_CARD_HEIGHT + 36;
  const questionCardTop = questionCardBottom + questionCardMaxHeight;

  // Fixed visual breathing room between the ship's bottom edge and the
  // question card's top edge. This is ADDED on top of the card's own
  // geometry (never subtracted), so the ship can never overlap the
  // card regardless of screen size, safe-area insets, or device type —
  // there's no overlap amount to accidentally under/over-tune per device.
  const SHIP_QUESTION_GAP = isTablet ? 20 : 14;
  const shipBottomOffset = questionCardTop + SHIP_QUESTION_GAP;
  const shipX = gameSize.width / 2 - shipSize / 2;
  const shipY = gameSize.height - shipSize - shipBottomOffset;
  const topSafeZone = insets.top + HEADER_HEIGHT + QUESTION_CARD_MARGIN;
  const bottomSafeZone = shipY - QUESTION_CARD_MARGIN;

  /* ---------------- Game engine ---------------- */
  const engine = useSpaceBlastEngine({
    flashcards,
    minFlashcards,
    maxLives,
    maxBullets,
    fireCooldownMs,
    isDataLoading,
    onAnswer,
    shipX,
    shipY,
    shipSize,
    playArea: { width: gameSize.width, top: topSafeZone, bottom: bottomSafeZone },
  });

  const showMinCardsModal = engine.isReady && !engine.hasEnoughCards;

  /* ---------------- Study folder pill (header) ---------------- */
  const [internalSetId] = useState<string | undefined>(currentStudySetId ?? studySets[0]?.id);
  const activeSetId = currentStudySetId ?? internalSetId;
  const currentStudySet = studySets.find((s) => s.id === activeSetId);

  /* ---------------- Navigation fallbacks ---------------- */
  const goToGameTab = useCallback(() => router.replace("/(tabs)/game"), [router]);

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.replace("/(tabs)/game");
    else router.replace("/");
  }, [onBack, router]);

  const handleOpenFolderPicker = useCallback(() => {
    router.replace({ pathname: "/games/SelectionWizard", params: { gameRoute: "/games/SpaceBlast" } });
  }, [router]);

  const handleGoToLibrary = useCallback(() => {
    if (onGoToLibrary) return onGoToLibrary();
    router.replace("/(tabs)/library");
  }, [onGoToLibrary, router]);

  /**
   * Awaits the optional onWin callback (which flushes the pending batch)
   * before restarting the game, so the batch is persisted before the next
   * session's state is initialised.
   */
  const handleWinModalOk = useCallback(async () => {
    await onWin?.();
    engine.restart();
  }, [engine, onWin]);

  /**
   * Awaits the optional onGameOver callback (which flushes the pending
   * batch and navigates) or falls back to navigating directly to the Games tab.
   */
  const handleGameOverOk = useCallback(async () => {
    if (onGameOver) {
      await onGameOver();
    } else {
      goToGameTab();
    }
  }, [onGameOver, goToGameTab]);

  return (
    <View style={[styles.container, { backgroundColor }, style]} onLayout={handleLayout}>
      {stars.map((star) => (
        <Star key={star.id} config={star} />
      ))}

      {shootingStars &&
        Array.from({ length: NUM_SHOOTING_STAR_SLOTS }, (_, i) => <ShootingStar key={i} slotIndex={i} />)}

      {engine.showGame &&
        engine.objects.map((obj) => (
          <AnswerBubble key={obj.id} obj={obj} hitState={engine.hitStates[obj.id] ?? "none"} />
        ))}

      {engine.showGame && engine.bullets.map((bullet) => <Bullet key={bullet.id} bullet={bullet} />)}

      {engine.showGame &&
        engine.explosions.map((explosion) => (
          <Explosion key={explosion.id} explosion={explosion} onDone={engine.handleExplosionDone} />
        ))}

      {/* A single full-screen tap target behind the HUD, used for aiming. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={engine.handleTap} />

      {engine.showGame && <Spaceship x={shipX} y={shipY} size={shipSize} />}

      <GameHeader
        topInset={insets.top}
        showFolderPill={engine.showGame}
        folderName={currentStudySet ? currentStudySet.name : "change"}
        onBack={handleBack}
        onChangeFolder={handleOpenFolderPicker}
      />

      {engine.showGame && (
        <>
          <LivesRow top={insets.top + 8 + HEADER_HEIGHT} lives={engine.lives} maxLives={maxLives} />
          <QuestionCard
            bottom={questionCardBottom}
            questionText={engine.currentCard.question}
            currentNumber={engine.safeIndex + 1}
            totalCount={flashcards.length}
          />
        </>
      )}

      {showMinCardsModal && (
        <MinCardsModal
          minFlashcards={minFlashcards}
          currentCount={flashcards.length}
          onGoToLibrary={handleGoToLibrary}
          onClose={handleBack}
        />
      )}

      {engine.showWinModal && <WinModal totalCount={flashcards.length} onOk={handleWinModalOk} />}

      {engine.showGameOverModal && <GameOverModal onOk={handleGameOverOk} />}

      {!engine.isReady && <LoadingOverlay />}

      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default SpaceBackground;
