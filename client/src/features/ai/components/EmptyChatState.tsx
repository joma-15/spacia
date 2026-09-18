/**
 * EmptyChatState.tsx
 * ─────────────────────────────────────────────
 * Clean, simple ChatGPT-style empty state:
 * - Centered AI icon
 * - Friendly headline
 * - Compact prompt pill chips
 */

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AI_THEME, QUICK_PROMPTS } from "../constants";
import { SelectedFolderContext } from "../types";

interface EmptyChatStateProps {
  selectedFolder: SelectedFolderContext;
  onSelectPrompt: (prompt: string) => void;
  onChangeFolder: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  selectedFolder,
  onSelectPrompt,
  onChangeFolder,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Center Mascot Icon ── */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="creation"
          size={32}
          color={AI_THEME.primary}
        />
      </View>

      <Text style={styles.headline}>What would you like to study?</Text>

      {/* ── Active Folder Context ── */}
      <TouchableOpacity
        style={styles.contextPill}
        onPress={onChangeFolder}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="folder-outline"
          size={14}
          color={selectedFolder.accentColor || AI_THEME.primary}
        />
        <Text style={styles.contextPillText}>
          {selectedFolder.name}
          {selectedFolder.cardCount > 0 ? ` (${selectedFolder.cardCount} cards)` : ""}
        </Text>
        <Text style={styles.contextChangeText}>Change</Text>
      </TouchableOpacity>

      {/* ── Quick Prompt Chips (Simple ChatGPT Style) ── */}
      <View style={styles.chipsContainer}>
        {QUICK_PROMPTS.slice(0, 4).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.chip}
            onPress={() => onSelectPrompt(item.prompt)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={16}
              color={AI_THEME.primary}
            />
            <Text style={styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AI_THEME.surface,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headline: {
    fontSize: 20,
    fontWeight: "800",
    color: AI_THEME.textWhite,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  contextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AI_THEME.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    marginBottom: 32,
  },
  contextPillText: {
    color: AI_THEME.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  contextChangeText: {
    color: AI_THEME.primary,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  chipsContainer: {
    width: "100%",
    maxWidth: 380,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: AI_THEME.surface,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: "45%",
    flexGrow: 1,
  },
  chipText: {
    color: AI_THEME.textWhite,
    fontSize: 13,
    fontWeight: "600",
  },
});
