/**
 * ChatInputBar.tsx
 * ─────────────────────────────────────────────
 * Modern ChatGPT-style input dock for asking Spacia AI questions,
 * with active folder indicator tag and responsive send button.
 */

import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AI_THEME } from "../constants";
import { SelectedFolderContext } from "../types";

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  selectedFolder: SelectedFolderContext;
  onResetFolder: () => void;
  isThinking: boolean;
  isKeyboardVisible?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChangeText,
  onSend,
  selectedFolder,
  onResetFolder,
  isThinking,
  isKeyboardVisible = false,
}) => {
  const canSend = value.trim().length > 0 && !isThinking;

  return (
    <View style={styles.container}>
      {/* ── Active Folder Tag (if specific folder is active) ── */}
      {selectedFolder.id !== null && (
        <View style={styles.folderTag}>
          <MaterialCommunityIcons
            name="folder"
            size={12}
            color={selectedFolder.accentColor || AI_THEME.gold}
          />
          <Text style={styles.folderTagText} numberOfLines={1}>
            Focusing on: {selectedFolder.name}
          </Text>
          <TouchableOpacity onPress={onResetFolder} hitSlop={6}>
            <MaterialCommunityIcons
              name="close-circle"
              size={14}
              color={AI_THEME.textMuted}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Input Box ── */}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask anything about your study topic…"
          placeholderTextColor={AI_THEME.textDim}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={1000}
          editable={!isThinking}
          returnKeyType="default"
        />

        {/* ── Send Button ── */}
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.7}
          accessibilityLabel="Send message"
        >
          <MaterialCommunityIcons
            name="arrow-up"
            size={20}
            color={canSend ? AI_THEME.bg : AI_THEME.textDim}
          />
        </TouchableOpacity>
      </View>

      {/* ── Disclaimer (hidden during active typing) ── */}
      {!isKeyboardVisible && (
        <Text style={styles.disclaimer}>
          Spacia AI can make mistakes. Verify critical facts with your course notes.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AI_THEME.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: AI_THEME.border,
  },
  folderTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: AI_THEME.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AI_THEME.border,
  },
  folderTagText: {
    color: AI_THEME.textWhite,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 240,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: AI_THEME.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    minHeight: 46,
    maxHeight: 120,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: AI_THEME.textWhite,
    fontSize: 14.5,
    lineHeight: 20,
    maxHeight: 100,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    paddingBottom: Platform.OS === "ios" ? 4 : 8,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AI_THEME.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: AI_THEME.primary,
  },
  disclaimer: {
    fontSize: 10,
    color: AI_THEME.textDim,
    textAlign: "center",
    marginTop: 6,
  },
});
