import React from "react";
import { StyleSheet, View } from "react-native";
import { THEME } from "../colors";

/**
 * Draws the four little "sci-fi corner bracket" decorations you see on
 * the question card and the popup modals. Pass `danger` to switch them
 * to the red game-over color.
 */
const CornerFrame: React.FC<{ danger?: boolean }> = ({ danger }) => (
  <>
    <View style={[styles.cornerBracket, styles.cornerTL, danger && styles.cornerDanger]} />
    <View style={[styles.cornerBracket, styles.cornerTR, danger && styles.cornerDanger]} />
    <View style={[styles.cornerBracket, styles.cornerBL, danger && styles.cornerDanger]} />
    <View style={[styles.cornerBracket, styles.cornerBR, danger && styles.cornerDanger]} />
  </>
);

const styles = StyleSheet.create({
  cornerBracket: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: THEME.primary,
  },
  cornerTL: { top: -1, left: -1, borderLeftWidth: 2, borderTopWidth: 2, borderTopLeftRadius: 6 },
  cornerTR: { top: -1, right: -1, borderRightWidth: 2, borderTopWidth: 2, borderTopRightRadius: 6 },
  cornerBL: { bottom: -1, left: -1, borderLeftWidth: 2, borderBottomWidth: 2, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: -1, right: -1, borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: 6 },
  cornerDanger: { borderColor: THEME.wrong },
});

export default CornerFrame;
