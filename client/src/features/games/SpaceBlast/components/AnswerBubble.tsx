import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME, ROCK_PALETTES } from "../colors";
import { SpaceObject, HitState } from "../types";
import { getBubbleDimensions } from "../utils/answerSizing";

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

  const palette = ROCK_PALETTES[obj.laneIndex % ROCK_PALETTES.length];
  const isHit = hitState !== "none";

  // The same text sizing utility is used by spawning and rendering, so
  // the measured collision footprint always matches the visible bubble.
  const { fontSize } = useMemo(() => getBubbleDimensions(obj.label, obj.width), [obj.label, obj.width]);

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
          left: obj.x,
          top: obj.y,
          width: obj.width,
          height: obj.height,
          borderRadius: Math.min(obj.width, obj.height) / 2,
          borderColor,
          opacity,
          transform: [{ scale }],
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
            width: obj.width,
            height: obj.height,
            borderRadius: Math.min(obj.width, obj.height) / 2,
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
              width: obj.height * 0.22,
              height: obj.height * 0.22,
              borderRadius: obj.height * 0.11,
              top: obj.height * 0.18,
              left: obj.width * 0.72,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.height * 0.15,
              height: obj.height * 0.15,
              borderRadius: obj.height * 0.075,
              top: obj.height * 0.6,
              left: obj.width * 0.12,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.height * 0.12,
              height: obj.height * 0.12,
              borderRadius: obj.height * 0.06,
              top: obj.height * 0.68,
              left: obj.width * 0.7,
            },
          ]}
        />

        {isHit && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: overlayColor, borderRadius: Math.min(obj.width, obj.height) / 2 },
            ]}
          />
        )}

        <Text style={[styles.spaceObjectLabel, { fontSize }]}>
          {obj.label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
});

AnswerBubble.displayName = "AnswerBubble";

const styles = StyleSheet.create({
  spaceObject: {
    position: "absolute",
    borderWidth: 2,
  },
  rockGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    flexShrink: 1,
  },
});

export default AnswerBubble;
