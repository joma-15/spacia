import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME, ROCK_PALETTES } from "../colors";
import { SpaceObject, HitState } from "../types";

/**
 * One floating "space rock" that shows a possible answer's text.
 * When it gets shot, it flashes green (correct) or red (wrong), then
 * scales up and fades out.
 *
 * This component is purely visual — it doesn't know anything about
 * game rules. It's just told "here's a bubble" and "here's whether it
 * was just hit, and how".
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
        Animated.timing(scale, { toValue: 1.6, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(1);
      opacity.setValue(1);
    }
  }, [hitState, scale, opacity]);

  const translateX = obj.animX.interpolate({ inputRange: [0, 1], outputRange: [-obj.ampX, obj.ampX] });
  const translateY = obj.animY.interpolate({ inputRange: [0, 1], outputRange: [-obj.ampY, obj.ampY] });

  const palette = ROCK_PALETTES[obj.laneIndex % ROCK_PALETTES.length];
  const isHit = hitState !== "none";

  const overlayColor =
    hitState === "correct" ? THEME.correctGlow : hitState === "wrong" ? THEME.wrongGlow : "transparent";
  const borderColor =
    hitState === "correct" ? THEME.correct : hitState === "wrong" ? THEME.wrong : palette.border;
  const shadowColor = isHit ? (hitState === "correct" ? THEME.correct : THEME.wrong) : palette.glow;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spaceObject,
        {
          left: obj.x,
          top: obj.y,
          width: obj.size,
          height: obj.size,
          borderRadius: obj.size / 2,
          borderColor,
          shadowColor,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={palette.colors as unknown as [string, string]}
        start={{ x: 0.25, y: 0.2 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.rockGradient, { width: obj.size, height: obj.size, borderRadius: obj.size / 2 }]}
      >
        {/* Decorative crater dots so each rock looks a little rougher */}
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.size * 0.22,
              height: obj.size * 0.22,
              borderRadius: obj.size * 0.11,
              top: obj.size * 0.18,
              left: obj.size * 0.62,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.size * 0.15,
              height: obj.size * 0.15,
              borderRadius: obj.size * 0.075,
              top: obj.size * 0.6,
              left: obj.size * 0.18,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.crater,
            {
              backgroundColor: palette.craterColor,
              width: obj.size * 0.12,
              height: obj.size * 0.12,
              borderRadius: obj.size * 0.06,
              top: obj.size * 0.68,
              left: obj.size * 0.6,
            },
          ]}
        />

        {isHit && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor, borderRadius: obj.size / 2 }]}
          />
        )}

        <Text style={styles.spaceObjectLabel} numberOfLines={3}>
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
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },
});

export default AnswerBubble;
