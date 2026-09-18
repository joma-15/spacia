/**
 * AiChatScreen.tsx
 * ─────────────────────────────────────────────
 * Root screen for Spacia AI chat:
 * Provides a ChatGPT-like study companion interface where students can
 * select subject folders, ask questions, summarize topics, and generate quizzes.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AI_THEME, generateMockAiResponse } from "../constants";
import { ChatMessage, SelectedFolderContext } from "../types";
import { AiHeader } from "../components/AiHeader";
import { FolderSelectModal } from "../components/FolderSelectModal";
import { ChatMessageItem } from "../components/ChatMessageItem";
import { TypingIndicator } from "../components/TypingIndicator";
import { EmptyChatState } from "../components/EmptyChatState";
import { ChatInputBar } from "../components/ChatInputBar";
import { useFolders } from "@/features/library/hooks/useFolders";

const BOTTOM_NAV_HEIGHT = 64;

export const AiChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { folders } = useFolders();

  const [selectedFolder, setSelectedFolder] = useState<SelectedFolderContext>({
    id: null,
    name: "All Folders",
    cardCount: 0,
    accentColor: AI_THEME.gold,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Monitor keyboard visibility to dynamically clear padding and scroll chat to end
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Send message handler (supports both typing input and prompt chips)
  const handleSendMessage = useCallback(
    (explicitPrompt?: string) => {
      const text = (explicitPrompt ?? inputText).trim();
      if (!text || isThinking) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        folderId: selectedFolder.id ?? undefined,
        folderName: selectedFolder.name,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsThinking(true);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simulate AI thinking and response generation
      setTimeout(() => {
        const responseText = generateMockAiResponse(text, selectedFolder.name);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }, 1000);
    },
    [inputText, isThinking, selectedFolder],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInputText("");
    setIsThinking(false);
  }, []);

  const handleCreateFlashcard = useCallback((content: string) => {
    Alert.alert(
      "Create Flashcard",
      "Would you like to draft a new flashcard from this AI response?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create Draft",
          onPress: () => {
            Alert.alert("Success", "Card draft saved to your study deck!");
          },
        },
      ],
    );
  }, []);

  // Dynamic bottom padding calculation using safe area insets:
  // When typing (keyboard is visible):
  //   BottomNav is hidden.
  //   On Android, we apply Math.max(insets.bottom, 0) so gesture/system bars don't cover the textbox.
  //   On iOS, KeyboardAvoidingView offsets by keyboard height, so container padding is 0.
  // When idle (keyboard is hidden):
  //   BottomNav is pinned to the bottom, so we add BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8).
  const dynamicBottomPadding = isKeyboardVisible
    ? (Platform.OS === "android" ? Math.max(insets.bottom, 0) : 0)
    : BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── Top Header ── */}
      <AiHeader
        selectedFolder={selectedFolder}
        onOpenFolderModal={() => setFolderModalVisible(true)}
        onNewChat={handleNewChat}
      />

      <KeyboardAvoidingView
        style={[styles.chatArea, { paddingBottom: dynamicBottomPadding }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ── Messages List or Empty State ── */}
        {messages.length === 0 ? (
          <EmptyChatState
            selectedFolder={selectedFolder}
            onSelectPrompt={(p) => handleSendMessage(p)}
            onChangeFolder={() => setFolderModalVisible(true)}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessageItem
                message={item}
                onCreateFlashcard={handleCreateFlashcard}
              />
            )}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={isThinking ? <TypingIndicator /> : null}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />
        )}

        {/* ── Bottom Input Dock ── */}
        <ChatInputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={() => handleSendMessage()}
          selectedFolder={selectedFolder}
          onResetFolder={() =>
            setSelectedFolder({
              id: null,
              name: "All Folders",
              cardCount: 0,
              accentColor: AI_THEME.gold,
            })
          }
          isThinking={isThinking}
          isKeyboardVisible={isKeyboardVisible}
        />
      </KeyboardAvoidingView>

      {/* ── Folder Selection Modal ── */}
      <FolderSelectModal
        visible={folderModalVisible}
        folders={folders}
        currentFolder={selectedFolder}
        onSelect={setSelectedFolder}
        onClose={() => setFolderModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default AiChatScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AI_THEME.bg,
  },
  chatArea: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 14,
  },
});
