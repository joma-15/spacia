import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME, ROCK_PALETTES } from "../colors";
import { SpaceObject, HitState } from "../types";
import { estimateDisplaySize, estimateFontSize } from "../utils/answerSizing";

/**
 * One floating "space rock" that shows a possible answer's text.
 * When it gets shot, it flashes green (correct) or red (wrong), then
 * scales up and fades out.
 *
 * This component is purely visual — it doesn't know anything about
 * game rules. It's just told "here's a bubble" and "here's whether it
 * was just hit, and how".
 *
 * Text-driven sizing (how much a long label grows the bubble) lives in
 * utils/answerSizing.ts, shared with the spawn logic — see that file's
 * comment for why that matters (spawn positioning depends on knowing
 * exactly how big a bubble will render).
 */
const AnswerBubble: React.FC<{
  obj: SpaceObject;
  hitState: "none" | HitState;
}> = React.memo(({ obj, hitState }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hitState !== "none") {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(1);
      opacity.setValue(1);
    }
  }, [hitState, scale, opacity]);

  const translateX = obj.animX.interpolate({
    inputRange: [0, 1],
    outputRange: [-obj.ampX, obj.ampX],
  });
  const translateY = obj.animY.interpolate({
    inputRange: [0, 1],
    outputRange: [-obj.ampY, obj.ampY],
  });

  const palette = ROCK_PALETTES[obj.laneIndex % ROCK_PALETTES.length];
  const isHit = hitState !== "none";

  // Grow the rendered bubble based on how long the answer text is, so
  // longer answers don't get clipped or squeezed. `obj.size` stays the
  // baseline/minimum — we only ever scale up from it. The spawn logic
  // (spawnAnswer.ts) reserves room for this same growth when it picks
  // a position, so a grown bubble is guaranteed to still fit where it
  // was placed.
  const { displaySize, fontSize, offset } = useMemo(() => {
    const size = estimateDisplaySize(obj.size, obj.label);
    const font = estimateFontSize(obj.label);

    // Keep the bubble centered on its original anchor point instead of
    // growing only to the bottom-right.
    const diff = size - obj.size;

    return { displaySize: size, fontSize: font, offset: diff / 2 };
  }, [obj.size, obj.label]);

  const overlayColor =
    hitState === "correct"
      ? THEME.correctGlow
      : hitState === "wrong"
        ? THEME.wrongGlow
        : "transparent";
  const borderColor =
    hitState === "correct"
      ? THEME.correct
      : hitState === "wrong"
        ? THEME.wrong
        : palette.border;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spaceObject,
        {
          left: obj.x - offset,
          top: obj.y - offset,
          width: displaySize,
          height: displaySize,
          borderRadius: displaySize / 2,
          borderColor,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={palette.colors as unknown as [string, string]}
        start={{ x: 0.25, y: 0.2 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.rockGradient,
          {
            width: displaySize,
            height: displaySize,
            borderRadius: displaySize / 2,
          },
        ]}
      >
        {/* Decorative crater dots so each rock looks a little rougher */}
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: displaySize * 0.22,
              height: displaySize * 0.22,
              borderRadius: displaySize * 0.11,
              top: displaySize * 0.18,
              left: displaySize * 0.62,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: displaySize * 0.15,
              height: displaySize * 0.15,
              borderRadius: displaySize * 0.075,
              top: displaySize * 0.6,
              left: displaySize * 0.18,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: displaySize * 0.12,
              height: displaySize * 0.12,
              borderRadius: displaySize * 0.06,
              top: displaySize * 0.68,
              left: displaySize * 0.6,
            },
          ]}
        />

        {isHit && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: overlayColor, borderRadius: displaySize / 2 },
            ]}
          />
        )}

        <Text style={[styles.spaceObjectLabel, { fontSize }]} numberOfLines={3}>
          {obj.label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  spaceObject: {
    position: "absolute",
    borderWidth: 2,
  },
  rockGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  crater: {
    position: "absolute",
  },
  spaceObjectLabel: {
    color: THEME.textWhite,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },
});

export default AnswerBubble;
