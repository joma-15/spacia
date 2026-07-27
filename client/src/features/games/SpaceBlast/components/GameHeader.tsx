import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HEADER_HEIGHT } from "../constants";
import { THEME } from "../colors";

/**
 * Top bar of the game screen: a back button on the left, and (once the
 * game has actually started) a pill on the right showing which study
 * folder is active, tappable to switch folders.
 */
const GameHeader: React.FC<{
  topInset: number;
  showFolderPill: boolean;
  folderName: string;
  onBack: () => void;
  onChangeFolder: () => void;
}> = ({ topInset, showFolderPill, folderName, onBack, onChangeFolder }) => (
  <View style={[styles.header, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
    <Pressable onPress={onBack} hitSlop={10} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
      <View style={styles.backArrow} />
    </Pressable>

    {showFolderPill && (
      <View style={styles.headerRightGroup} pointerEvents="box-none">
        <Pressable
          onPress={onChangeFolder}
          hitSlop={6}
          style={({ pressed }) => [styles.folderButton, pressed && styles.pressed]}
        >
          <View style={styles.folderIconSmall} />
          <Text style={styles.folderLabel} numberOfLines={1}>
            {folderName}
          </Text>
        </Pressable>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: HEADER_HEIGHT + 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    width: 11,
    height: 11,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    borderColor: "#ffffff",
    transform: [{ rotate: "45deg" }],
    marginLeft: 4,
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  folderButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 12,
    maxWidth: 260,
  },
  folderIconSmall: {
    width: 16,
    height: 12,
    backgroundColor: THEME.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  folderLabel: {
    color: THEME.textWhite,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default GameHeader;
