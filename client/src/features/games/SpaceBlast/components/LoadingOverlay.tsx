import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { THEME } from "../colors";

/**
 * Full-screen cover shown while game images and/or the flashcard data
 * are still loading. Nothing else in the game renders underneath this
 * until loading finishes — that's what stops the player from ever
 * seeing a blank/broken frame on a cold start.
 */
const LoadingOverlay: React.FC = () => (
  <View style={styles.loadingOverlay} pointerEvents="auto">
    <Spinner />
    <Text style={styles.loadingTitle}>PREPARING MISSION</Text>
    <Text style={styles.loadingSubtitle}>Loading assets…</Text>
  </View>
);

/** The spinning ring itself. Just a rotating circle — no gameplay logic. */
const Spinner: React.FC = React.memo(() => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]} />;
});

const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: THEME.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: THEME.border,
    borderTopColor: THEME.primary,
    marginBottom: 18,
  },
  loadingTitle: {
    color: THEME.textWhite,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  loadingSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default LoadingOverlay;
