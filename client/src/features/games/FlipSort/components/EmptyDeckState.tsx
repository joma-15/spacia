/**
 * EmptyDeckState.tsx
 * ─────────────────────────────────────────────
 * Shown instead of the whole screen when the folder has zero cards.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../colors";

const EmptyDeckState: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.screen,
      { paddingTop: insets.top, paddingBottom: insets.bottom },
    ]}>
      <Text style={styles.text}>No cards in this folder yet.</Text>
    </View>
  );
};

export default EmptyDeckState;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.screenBg, justifyContent: "center" },
  text: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
