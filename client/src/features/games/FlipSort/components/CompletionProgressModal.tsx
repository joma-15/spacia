import React, { useEffect, useMemo, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../colors";

interface CompletionProgressModalProps {
  visible: boolean;
  understoodCount: number;
  reviewCount: number;
  onDone: () => void;
}

const SEGMENT_COUNT = 24;
const CIRCLE_SIZE = 176;
const SEGMENT_RADIUS = 76;

function CircularProgress() {
  const [progress] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.94));
  const [percentage, setPercentage] = useState(0);
  const segments = useMemo(() => Array.from({ length: SEGMENT_COUNT }, (_, index) => index), []);

  useEffect(() => {
    progress.setValue(0);
    scale.setValue(0.94);
    const percentageListener = progress.addListener(({ value }) => {
      setPercentage(Math.round(value * 100));
    });
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();

    return () => progress.removeListener(percentageListener);
  }, [progress, scale]);

  return (
    <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
      {segments.map((segment) => {
        const threshold = segment / SEGMENT_COUNT;
        const opacity = progress.interpolate({
          inputRange: [0, Math.max(0.001, threshold), 1],
          outputRange: [0.22, 1, 1],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={segment}
            style={[
              styles.segment,
              {
                opacity,
                transform: [
                  { rotate: `${segment * (360 / SEGMENT_COUNT)}deg` },
                  { translateY: -SEGMENT_RADIUS },
                ],
              },
            ]}
          />
        );
      })}
      <Text style={styles.percentage}>{percentage}%</Text>
    </Animated.View>
  );
}

export function CompletionProgressModal({
  visible,
  understoodCount,
  reviewCount,
  onDone,
}: CompletionProgressModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Flip & Sort Complete 🎉</Text>
          {visible && <CircularProgress />}

          <View style={styles.stats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Understood</Text>
              <Text style={styles.understoodValue}>{understoodCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>To review</Text>
              <Text style={styles.reviewValue}>{reviewCount}</Text>
            </View>
          </View>

          <Pressable onPress={onDone} style={styles.doneButton} accessibilityRole="button">
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    backgroundColor: COLORS.cardFrontBg,
    borderWidth: 1,
    borderColor: COLORS.cardFrontBorder,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 22,
  },
  segment: {
    position: "absolute",
    left: CIRCLE_SIZE / 2 - 4,
    top: CIRCLE_SIZE / 2 - 12.5,
    width: 8,
    height: 25,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  percentage: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: "800",
  },
  stats: {
    width: "100%",
    gap: 10,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  understoodValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  reviewValue: {
    color: COLORS.reviewText,
    fontSize: 18,
    fontWeight: "800",
  },
  doneButton: {
    alignSelf: "stretch",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
  },
  doneText: {
    color: COLORS.screenBg,
    fontSize: 16,
    fontWeight: "800",
  },
});
