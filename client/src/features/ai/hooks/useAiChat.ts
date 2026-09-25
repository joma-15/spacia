/**
 * useAiChat.ts
 * ─────────────────────────────────────────────
 * Business hook for the AI chat feature.
 *
 * Manages all chat state and delegates network calls to aiChatService.
 * AiChatScreen only needs to call these methods — no API logic lives
 * in the screen component.
 *
 * State owned here:
 *   - messages       — the chat history displayed in the UI
 *   - conversationId — the active conversation's server-side ID
 *   - isThinking     — true while waiting for the AI response
 *   - isLoading      — true while the initial conversation is being loaded
 *   - error          — the last error message (null when healthy)
 */

import { useCallback, useRef, useState } from "react";
import { ChatMessage } from "../types";
import * as aiChatService from "../services/aiChatService";
import { ApiRequestError } from "@/shared/services/authenticatedFetch";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loadFolders } from "@/shared/services/folderDataService";

interface UseAiChatReturn {
  /** Messages currently displayed in the chat list. */
  messages: ChatMessage[];
  /** True while loading the conversation or fetching history on mount. */
  isLoading: boolean;
  /** True while the backend / AI is processing a sent message. */
  isThinking: boolean;
  /** Last error message, or null when the system is healthy. */
  error: string | null;
  /**
   * Load (or create) the active conversation for a given folder.
   * Call this when the screen mounts or the selected folder changes.
   */
  loadConversation: (folderId: string | null) => Promise<void>;
  /**
   * Send a new user message.
   * Adds the user message optimistically, then adds the AI reply when it arrives.
   */
  sendMessage: (content: string) => Promise<void>;
  /**
   * Start a fresh conversation for the current folder, clearing the message list.
   */
  startNewChat: (folderId: string | null) => Promise<void>;
  /** Clear the last error (e.g. after the user dismisses an error banner). */
  clearError: () => void;
}

/**
 * Convert an API Message to the local ChatMessage shape used by the UI components.
 * This keeps the UI decoupled from the exact API response format.
 */
function toLocalMessage(msg: {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}, actions: ChatMessage["actions"] = []): ChatMessage {
  const date = new Date(msg.createdAt);
  const timestamp = isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp,
    actions,
  };
}

export function useAiChat(): UseAiChatReturn {
  const { cacheOwnerId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the conversation ID in a ref so callbacks always see the latest value
  // without re-creating themselves (avoids stale closures in the screen).
  const conversationIdRef = useRef<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ---------------------------------------------------------------------------
  // loadConversation
  // ---------------------------------------------------------------------------

  const loadConversation = useCallback(async (folderId: string | null) => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    conversationIdRef.current = null;

    try {
      // Get or create the active conversation for this folder
      const conversation = await aiChatService.getOrCreateConversation(folderId);
      conversationIdRef.current = conversation.id;

      // Fetch the existing message history so the user can see prior context
      const history = await aiChatService.getMessages(conversation.id);
      const localMessages = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map(toLocalMessage);

      setMessages(localMessages);
    } catch (err) {
      const message = friendlyError(err, "Failed to load conversation.");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // sendMessage
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(async (content: string) => {
    const conversationId = conversationIdRef.current;
    if (!conversationId) {
      setError("No active conversation. Please try again.");
      return;
    }
    if (!content.trim() || isThinking) return;

    // Optimistic update: show the user's message immediately
    const optimisticUserMsg: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsThinking(true);
    setError(null);

    try {
      const result = await aiChatService.sendMessage(conversationId, content.trim());
      const localAiMsg = toLocalMessage(result.message, result.actions);

      if (cacheOwnerId && result.actions.some((action) =>
        ["create_folder", "create_folder_with_flashcards"].includes(action.type) && !action.result.error,
      )) {
        void loadFolders(cacheOwnerId, "network-only").catch(() => undefined);
      }

      // Replace nothing — just append the real AI response.
      // The optimistic user message stays (its content is correct).
      setMessages((prev) => [...prev, localAiMsg]);
    } catch (err) {
      // Remove the optimistic message on failure so the user knows it wasn't sent
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticUserMsg.id),
      );
      const message = friendlyError(err, "Failed to get a response. Please try again.");
      setError(message);
    } finally {
      setIsThinking(false);
    }
  }, [cacheOwnerId, isThinking]);

  // ---------------------------------------------------------------------------
  // startNewChat
  // ---------------------------------------------------------------------------

  const startNewChat = useCallback(async (folderId: string | null) => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    conversationIdRef.current = null;

    try {
      const conversation = await aiChatService.createConversation(folderId);
      conversationIdRef.current = conversation.id;
    } catch (err) {
      const message = friendlyError(err, "Failed to start a new chat.");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------

  return {
    messages,
    isLoading,
    isThinking,
    error,
    loadConversation,
    sendMessage,
    startNewChat,
    clearError,
  };
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

/**
 * Convert an unknown thrown value into a user-friendly string.
 * Never exposes stack traces or internal server errors.
 */
function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof ApiRequestError) {
    // 401/403 — authentication issue
    if (err.status === 401 || err.status === 403) {
      return "Your session has expired. Please log in again.";
    }
    // 404 — conversation was deleted from another device
    if (err.status === 404) {
      return "This conversation no longer exists. Starting fresh.";
    }
    // 503/502 — AI provider issue
    if (err.status >= 502 && err.status <= 503) {
      return "The AI service is temporarily unavailable. Please try again in a moment.";
    }
    // Surface the server's own message for other cases (400, 500 etc.)
    if (err.message) return err.message;
  }
  return fallback;
}
