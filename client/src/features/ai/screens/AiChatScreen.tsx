/**
 * AiChatScreen.tsx
 * ─────────────────────────────────────────────
 * Root screen for Spacia AI chat.
 *
 * Layout strategy (avoids the absolute-positioned BottomNav trap):
 *  - The screen is a simple flex column: Header → Chat List → Input Bar
 *  - We listen to keyboard events and store the keyboard height.
 *  - When the keyboard is closed → paddingBottom = BOTTOM_NAV_HEIGHT + insets.bottom
 *    so the input bar sits above the bottom nav bar.
 *  - When the keyboard is open → paddingBottom = keyboardHeight (the actual height the
 *    keyboard occupies above the bottom edge of the screen).
 *    On iOS, keyboardEndCoordinates.height already includes the home indicator.
 *    On Android, we add insets.bottom to compensate for gesture nav bars.
 *  - No KeyboardAvoidingView is used — it fights with the absolute nav bar.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

import { useAd } from "@/shared/context/AdContext";

const BOTTOM_NAV_HEIGHT = 64;

export const AiChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { folders } = useFolders();
  const { isAdVisible } = useAd();

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

  // Track keyboard height and visibility
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      // e.endCoordinates.height is the keyboard height INCLUDING
      // the home indicator on iOS. On Android we compensate with insets.bottom.
      const height =
        Platform.OS === "android"
          ? e.endCoordinates.height + insets.bottom
          : e.endCoordinates.height;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
      setTimeout(
        () => {
          flatListRef.current?.scrollToEnd({ animated: true });
        },
        Platform.OS === "ios" ? 250 : 50,
      );
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  // Compute the bottom padding for the whole screen content:
  // ─ Keyboard open  → lift everything by keyboard height so nothing is hidden behind it
  // ─ Keyboard closed → lift everything above the pinned bottom nav bar
  const contentBottomPadding = isKeyboardVisible
    ? Math.max(keyboardHeight - 8, 0)
    : Math.max(BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8), 0);

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

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── Top Header ── */}
      <AiHeader
        selectedFolder={selectedFolder}
        onOpenFolderModal={() => setFolderModalVisible(true)}
        onNewChat={handleNewChat}
      />

      {/*
        ── Chat area + Input dock in a flex column ──
        paddingBottom shifts the whole column up by exactly the keyboard
        height (or the nav bar height when keyboard is closed).
      */}
      <View style={[styles.chatArea, { paddingBottom: contentBottomPadding }]}>
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
      </View>

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
