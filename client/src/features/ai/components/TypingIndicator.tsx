/**
 * TypingIndicator.tsx
 * ─────────────────────────────────────────────
 * Animated 3-dot thinking indicator shown when Spacia AI is generating a response.
 */

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AI_THEME } from "../constants";

export const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ]),
      );
    };

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 180);
    const a3 = animateDot(dot3, 360);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const translateY = (dot: Animated.Value) =>
    dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

  const opacity = (dot: Animated.Value) =>
    dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    });

  return (
    <View style={styles.container}>
      {/* ── AI Avatar ── */}
      <View style={styles.avatar}>
        <MaterialCommunityIcons
          name="creation"
          size={14}
          color={AI_THEME.primary}
        />
      </View>

      {/* ── Bubble with 3 bouncing dots ── */}
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: translateY(dot1) }],
                opacity: opacity(dot1),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: translateY(dot2) }],
                opacity: opacity(dot2),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: translateY(dot3) }],
                opacity: opacity(dot3),
              },
            ]}
          />
        </View>
        <Text style={styles.thinkingText}>Spacia AI is thinking…</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AI_THEME.surfaceAlt,
    borderWidth: 1,
    borderColor: AI_THEME.borderBright,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: {
    backgroundColor: AI_THEME.assistantBubble,
    borderWidth: 1,
    borderColor: AI_THEME.assistantBubbleBorder,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AI_THEME.primary,
  },
  thinkingText: {
    fontSize: 12,
    color: AI_THEME.textMuted,
    fontStyle: "italic",
  },
});
