/**
 * ChatMessageItem.tsx
 * ─────────────────────────────────────────────
 * Clean ChatGPT-style message presentation:
 * - User: sleek rounded bubble on the right
 * - Assistant: clean text on canvas with subtle avatar and action toolbar
 */

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AI_THEME } from "../constants";
import { ChatMessage } from "../types";

interface ChatMessageItemProps {
  message: ChatMessage;
  onCreateFlashcard?: (text: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onCreateFlashcard,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  // Assistant message rendering (ChatGPT-style clean text with headings & bullets)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <Text key={idx} style={styles.headerText}>
            {line.replace("### ", "")}
          </Text>
        );
      }
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <View key={idx} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {line.trim().replace(/^[-*]\s+/, "")}
            </Text>
          </View>
        );
      }
      if (line.trim() === "") {
        return <View key={idx} style={styles.lineSpacer} />;
      }
      return (
        <Text key={idx} style={styles.assistantText}>
          {line}
        </Text>
      );
    });
  };

  return (
    <View style={styles.assistantContainer}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons
          name="creation"
          size={14}
          color={AI_THEME.primary}
        />
      </View>

      <View style={styles.assistantContentWrap}>
        <View style={styles.assistantTextContainer}>
          {renderFormattedContent(message.content)}
        </View>

        {Array.isArray(message.actions) && !message.actions.some(
          (action) =>
            ["create_folder", "create_folder_with_flashcards"].includes(action?.type) &&
            action?.result && !action.result.error,
        ) && message.actions
          .filter((action) => action?.result && !action.result.error)
          .map((action, index) => (
          <View key={`${action.type}-${index}`} style={styles.actionChip}>
            <MaterialCommunityIcons name="check-circle-outline" size={13} color={AI_THEME.primary} />
            <Text style={styles.actionChipText}>{formatAction(action.type, action.result)}</Text>
          </View>
          ))}

        {/* ── Action Toolbar below assistant response ── */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={handleCopy}
            hitSlop={6}
            accessibilityLabel="Copy text"
          >
            <MaterialCommunityIcons
              name={copied ? "check" : "content-copy"}
              size={13}
              color={copied ? AI_THEME.primary : AI_THEME.textDim}
            />
            <Text
              style={[
                styles.toolbarBtnText,
                copied && { color: AI_THEME.primary },
              ]}
            >
              {copied ? "Copied" : "Copy"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => onCreateFlashcard?.(message.content)}
            hitSlop={6}
            accessibilityLabel="Turn into flashcard"
          >
          </TouchableOpacity>

          <View style={styles.feedbackGroup}>
            <TouchableOpacity
              onPress={() =>
                setFeedback((f) => (f === "like" ? null : "like"))
              }
              hitSlop={6}
            >
              <MaterialCommunityIcons
                name={feedback === "like" ? "thumb-up" : "thumb-up-outline"}
                size={13}
                color={
                  feedback === "like" ? AI_THEME.primary : AI_THEME.textDim
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setFeedback((f) => (f === "dislike" ? null : "dislike"))
              }
              hitSlop={6}
            >
              <MaterialCommunityIcons
                name={
                  feedback === "dislike" ? "thumb-down" : "thumb-down-outline"
                }
                size={13}
                color={
                  feedback === "dislike" ? "#F87171" : AI_THEME.textDim
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

function formatAction(type: string, result: Record<string, unknown>): string {
  const folder = result.folder as { subject?: string } | undefined;
  const count = result.count as number | undefined;
  if (type === "create_folder") return `Created ${folder?.subject ?? "folder"}`;
  if (type === "create_flashcards") return `Added ${count ?? 0} flashcards`;
  if (type === "create_folder_with_flashcards") return `Created ${folder?.subject ?? "folder"} with ${count ?? 0} flashcards`;
  if (type === "update_flashcard") return "Updated flashcard";
  if (type === "delete_flashcard") return "Deleted flashcard";
  return "Read study data";
}

const styles = StyleSheet.create({
  // User bubble
  userContainer: {
    alignSelf: "flex-end",
    marginVertical: 6,
    paddingHorizontal: 16,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: AI_THEME.surfaceAlt,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userText: {
    color: AI_THEME.textWhite,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
  },

  // Assistant layout
  assistantContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AI_THEME.surfaceAlt,
    borderWidth: 1,
    borderColor: AI_THEME.borderBright,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  assistantContentWrap: {
    flex: 1,
  },
  assistantTextContainer: {
    paddingVertical: 2,
  },
  headerText: {
    color: AI_THEME.primary,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  assistantText: {
    color: AI_THEME.textWhite,
    fontSize: 14.5,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginVertical: 2,
  },
  bulletDot: {
    color: AI_THEME.primary,
    fontSize: 14,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    color: AI_THEME.textWhite,
    fontSize: 14,
    lineHeight: 21,
  },
  lineSpacer: {
    height: 6,
  },
  actionChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: AI_THEME.primarySoft,
  },
  actionChipText: {
    color: AI_THEME.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toolbarBtnText: {
    color: AI_THEME.textDim,
    fontSize: 11,
    fontWeight: "600",
  },
  feedbackGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
});
