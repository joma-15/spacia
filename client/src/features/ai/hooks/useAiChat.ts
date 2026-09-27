/**
 * useAiChat.ts
 * ─────────────────────────────────────────────
 * Business hook for the AI chat feature.
 *
 * Caching strategy — cache-then-network:
 *   1. On loadConversation, read conversation + messages from SQLite instantly.
 *      → UI shows cached messages with ZERO network latency.
 *   2. In the background, fetch fresh data from the server.
 *      → Write results back to SQLite, then update UI silently.
 *   3. On sendMessage, append both the user message and AI reply to SQLite
 *      immediately after they are confirmed by the server.
 *   4. On startNewChat (user pressed "New Chat"), clear the cache for the
 *      old conversation and write the newly created one.
 *
 * State owned here:
 *   - messages       — the chat history displayed in the UI
 *   - conversationId — the active conversation's server-side ID
 *   - isThinking     — true while waiting for the AI response
 *   - isLoading      — true only on the very first cold load (no cache yet)
 *   - error          — the last error message (null when healthy)
 */

import { useCallback, useRef, useState } from "react";
import { ChatMessage } from "../types";
import * as aiChatService from "../services/aiChatService";
import {
  getCachedConversation,
  saveConversation,
  getCachedMessages,
  replaceMessages,
  saveMessage,
  deleteCachedConversation,
} from "@/shared/database/aiChatRepository";
import { ApiRequestError } from "@/shared/services/authenticatedFetch";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loadFolders } from "@/shared/services/folderDataService";
import { saveFlashcards } from "@/shared/database/flashcardRepository";
import { writeResource } from "@/shared/database/resourceCacheRepository";
import { setResourceMemory } from "@/shared/services/resourceStore";

const flashcardResourceKey = (folderId: string) => `flashcards:${folderId}`;

type GeneratedCard = {
  id: string;
  question: string;
  answer: string;
  status?: string;
  folder_id?: string;
};

/**
 * The Library reads flashcards from SQLite first. Mirror cards returned by a
 * successful AI tool action into that cache, so an AI-created card is visible
 * immediately instead of waiting for the normal five-minute cache refresh.
 */
function cacheAiGeneratedCards(userId: string, actions: ChatMessage["actions"]): void {
  for (const action of actions ?? []) {
    if (
      !["create_flashcards", "create_folder_with_flashcards"].includes(action.type) ||
      action.result.error
    ) {
      continue;
    }

    const folder = action.result.folder as { id?: unknown } | undefined;
    const cards = action.result.flashcards;
    const folderId = typeof folder?.id === "string" ? folder.id : undefined;
    if (!folderId || !Array.isArray(cards)) continue;

    const validCards = cards.filter(
      (card): card is GeneratedCard =>
        typeof card === "object" &&
        card !== null &&
        typeof (card as GeneratedCard).id === "string" &&
        typeof (card as GeneratedCard).question === "string" &&
        typeof (card as GeneratedCard).answer === "string",
    );
    if (!validCards.length) continue;

    saveFlashcards(
      userId,
      validCards.map((card) => ({
        ...card,
        folderId,
        status: card.status ?? "review",
      })),
      "synced",
    );
    const resource = flashcardResourceKey(folderId);
    writeResource(userId, resource, null);
    setResourceMemory(userId, resource, null);
  }
}

interface UseAiChatReturn {
  /** Messages currently displayed in the chat list. */
  messages: ChatMessage[];
  /**
   * True only on a cold load where there is no cache at all.
   * When cached messages exist this stays false — the UI is instant.
   */
  isLoading: boolean;
  /** True while the backend / AI is processing a sent message. */
  isThinking: boolean;
  /** Last error message, or null when the system is healthy. */
  error: string | null;
  /**
   * Load (or create) the active conversation for a given folder.
   * Reads from SQLite cache first, then refreshes from network in background.
   */
  loadConversation: (folderId: string | null) => Promise<void>;
  /**
   * Send a new user message.
   * Adds the user message optimistically, then adds the AI reply when it arrives.
   * Both are written to SQLite on success.
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
  // loadConversation — cache-then-network
  // ---------------------------------------------------------------------------

  const loadConversation = useCallback(async (folderId: string | null) => {
    const userId = cacheOwnerId;
    conversationIdRef.current = null;
    setError(null);

    // ── Step 1: Try the SQLite cache immediately ──────────────────────────────
    if (userId) {
      const cachedConv = getCachedConversation(userId, folderId);
      if (cachedConv) {
        conversationIdRef.current = cachedConv.id;
        const cachedMsgs = getCachedMessages(cachedConv.id);
        if (cachedMsgs.length > 0) {
          // Show cached messages instantly — no spinner needed
          setMessages(cachedMsgs.map((m) => toLocalMessage(m)));
          // Background-refresh from network (no loading state shown)
          void refreshFromNetwork(userId, folderId, cachedConv.id);
          return;
        }
      }
    }

    // ── Step 2: Cache miss — show spinner and fetch from network ──────────────
    setIsLoading(true);
    setMessages([]);

    try {
      const userId_ = cacheOwnerId; // may still be null on first render
      const conversation = await aiChatService.getOrCreateConversation(folderId);
      conversationIdRef.current = conversation.id;

      if (userId_) {
        saveConversation(userId_, conversation);
      }

      const history = await aiChatService.getMessages(conversation.id);
      const localMessages = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((message) => toLocalMessage(message));

      setMessages(localMessages);

      if (userId_) {
        replaceMessages(conversation.id, history);
      }
    } catch (err) {
      const message = friendlyError(err, "Failed to load conversation.");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [cacheOwnerId]);

  /**
   * Background network refresh — called when we already have a cache hit.
   * Updates SQLite and UI silently without any loading state or message reset.
   */
  async function refreshFromNetwork(
    userId: string,
    folderId: string | null,
    cachedConvId: string,
  ): Promise<void> {
    try {
      const conversation = await aiChatService.getOrCreateConversation(folderId);

      // If the server returned a different conversation (e.g. old one deleted),
      // update the ref and clear the stale cached one.
      if (conversation.id !== cachedConvId) {
        deleteCachedConversation(cachedConvId);
        conversationIdRef.current = conversation.id;
      }

      saveConversation(userId, conversation);

      const history = await aiChatService.getMessages(conversation.id);

      // Only update the UI if the fresh data differs from what we're showing
      const freshLocal = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => toLocalMessage(m));

      setMessages((prev) => {
        if (
          prev.length === freshLocal.length &&
          prev.every((m, i) => m.id === freshLocal[i].id && m.content === freshLocal[i].content)
        ) {
          return prev; // nothing changed — avoid re-render
        }
        return freshLocal;
      });

      replaceMessages(conversation.id, history);
    } catch {
      // Silent background failure — cached data stays visible, no error shown
    }
  }

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

      // Write the confirmed user message + AI reply to SQLite
      saveMessage(result.message);

      if (cacheOwnerId) {
        cacheAiGeneratedCards(cacheOwnerId, result.actions);
      }

      if (cacheOwnerId && result.actions.some((action) =>
        ["create_folder", "create_folder_with_flashcards"].includes(action.type) && !action.result.error,
      )) {
        void loadFolders(cacheOwnerId, "network-only").catch(() => undefined);
      }

      // Reload folder list when a folder was deleted by the AI
      if (cacheOwnerId && result.actions.some((action) =>
        action.type === "delete_folder" && !action.result.error,
      )) {
        void loadFolders(cacheOwnerId, "network-only").catch(() => undefined);
      }

      // Bust the flashcard cache for a folder whose cards were wiped by the AI
      if (cacheOwnerId) {
        for (const action of result.actions) {
          if (action.type === "delete_flashcards_in_folder" && !action.result.error) {
            const folder = action.result.folder as { id?: unknown } | undefined;
            const folderId = typeof folder?.id === "string" ? folder.id : undefined;
            if (folderId) {
              const resource = flashcardResourceKey(folderId);
              writeResource(cacheOwnerId, resource, null);
              setResourceMemory(cacheOwnerId, resource, null);
            }
          }
        }
      }

      // The optimistic user message content is already correct — keep it
      // and just append the confirmed AI reply.
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

      if (cacheOwnerId) {
        saveConversation(cacheOwnerId, conversation);
      }
    } catch (err) {
      const message = friendlyError(err, "Failed to start a new chat.");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [cacheOwnerId]);

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
