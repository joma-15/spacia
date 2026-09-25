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
 *
 * Data flow:
 *  - All chat state and API calls are managed by `useAiChat`.
 *  - When the selected folder changes, we call `loadConversation` to
 *    resume or create the conversation for that folder.
 *  - "New Chat" calls `startNewChat` which creates a fresh conversation.
 *  - Sending a message calls `sendMessage` — optimistic UI is handled by the hook.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AI_THEME } from "../constants";
import { ChatMessage, SelectedFolderContext } from "../types";
import { AiHeader } from "../components/AiHeader";
import { FolderSelectModal } from "../components/FolderSelectModal";
import { ChatMessageItem } from "../components/ChatMessageItem";
import { TypingIndicator } from "../components/TypingIndicator";
import { EmptyChatState } from "../components/EmptyChatState";
import { ChatInputBar } from "../components/ChatInputBar";
import { useFolders } from "@/features/library/hooks/useFolders";
import { useAd } from "@/shared/context/AdContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAiChat } from "../hooks/useAiChat";

const BOTTOM_NAV_HEIGHT = 64;

export const AiChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { folders } = useFolders();
  const { isAdVisible } = useAd();
  const { isAuthenticated } = useAuth();

  // ── AI chat state (backed by the real backend) ──
  const {
    messages,
    isLoading,
    isThinking,
    error,
    loadConversation,
    sendMessage,
    startNewChat,
    clearError,
  } = useAiChat();

  // ── UI state ──
  const [inputText, setInputText] = useState("");
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState<SelectedFolderContext>({
    id: null,
    name: "All Folders",
    cardCount: 0,
    accentColor: AI_THEME.gold,
  });

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // ── Load conversation when screen mounts or auth state becomes available ──
  useEffect(() => {
    if (isAuthenticated) {
      void loadConversation(selectedFolder.id);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: we only re-run on auth change here; folder changes are handled below.

  // ── Load conversation when the selected folder changes ──
  const previousFolderIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    // Skip the very first render (handled by the auth effect above)
    if (previousFolderIdRef.current === undefined) {
      previousFolderIdRef.current = selectedFolder.id;
      return;
    }
    // Only reload if the folder actually changed
    if (previousFolderIdRef.current !== selectedFolder.id) {
      previousFolderIdRef.current = selectedFolder.id;
      if (isAuthenticated) {
        void loadConversation(selectedFolder.id);
      }
    }
  }, [selectedFolder.id, isAuthenticated, loadConversation]);

  // ── Keyboard handling ──
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
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

  const contentBottomPadding = isKeyboardVisible
    ? Math.max(keyboardHeight - 8, 0)
    : Math.max(BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8), 0);

  // ── Message send handler ──
  const handleSendMessage = useCallback(
    async (explicitPrompt?: string) => {
      const text = (explicitPrompt ?? inputText).trim();
      if (!text || isThinking || isLoading) return;

      setInputText("");
      await sendMessage(text);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    },
    [inputText, isThinking, isLoading, sendMessage],
  );

  // ── New chat handler ──
  const handleNewChat = useCallback(async () => {
    await startNewChat(selectedFolder.id);
  }, [selectedFolder.id, startNewChat]);

  // ── Folder selection handler ──
  const handleSelectFolder = useCallback((folder: SelectedFolderContext) => {
    setSelectedFolder(folder);
    // Conversation loading is triggered by the selectedFolder.id effect above
  }, []);

  // ── Flashcard creation (UI-only for now) ──
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

      {/* ── Error Banner ── */}
      {error !== null && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color="#FCA5A5"
          />
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity onPress={clearError} hitSlop={8}>
            <MaterialCommunityIcons
              name="close"
              size={14}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
        </View>
      )}

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
            onSelectPrompt={(p) => void handleSendMessage(p)}
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
          onSend={() => void handleSendMessage()}
          selectedFolder={selectedFolder}
          onResetFolder={() =>
            handleSelectFolder({
              id: null,
              name: "All Folders",
              cardCount: 0,
              accentColor: AI_THEME.gold,
            })
          }
          isThinking={isThinking || isLoading}
          isKeyboardVisible={isKeyboardVisible}
        />
      </View>

      {/* ── Folder Selection Modal ── */}
      <FolderSelectModal
        visible={folderModalVisible}
        folders={folders}
        currentFolder={selectedFolder}
        onSelect={handleSelectFolder}
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBannerText: {
    flex: 1,
    color: "#FCA5A5",
    fontSize: 12,
    lineHeight: 16,
  },
});
