/**
 * aiChatService.ts
 * ─────────────────────────────────────────────
 * Typed HTTP client for all AI Assistant API endpoints.
 *
 * Uses the shared `authenticatedFetch` gateway — token refresh and
 * error handling are handled transparently by that layer.
 *
 * This service has no UI state; it only talks to the network.
 * All state management lives in the `useAiChat` hook.
 */

import { authenticatedFetch } from "@/shared/services/authenticatedFetch";
import { Conversation, Message, SendMessageResult } from "../types";

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/**
 * Resume the most recent conversation for a folder, or create a new one.
 *
 * This is the primary entry point called when the AI tab opens.
 * Passing `folderId = null` targets the "general" (no-folder) conversation.
 */
export async function getOrCreateConversation(
  folderId: string | null,
): Promise<Conversation> {
  const response = await authenticatedFetch("/ai/conversations/get-or-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId }),
  });
  const body = await response.json();
  return body.conversation as Conversation;
}

/**
 * Create a brand-new conversation (used by the "New Chat" button).
 */
export async function createConversation(
  folderId: string | null,
): Promise<Conversation> {
  const response = await authenticatedFetch("/ai/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId }),
  });
  const body = await response.json();
  return body.conversation as Conversation;
}

/**
 * Delete a conversation and all its messages.
 */
export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  await authenticatedFetch(`/ai/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * Fetch the full message history for a conversation.
 *
 * Used to restore previous messages when resuming a conversation.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const response = await authenticatedFetch(
    `/ai/conversations/${conversationId}/messages`,
  );
  const body = await response.json();
  return (body.messages ?? []) as Message[];
}

/**
 * Send a user message to the backend and receive the AI response.
 *
 * The backend:
 *   1. Authenticates the user.
 *   2. Verifies conversation ownership.
 *   3. Loads conversation history from the database.
 *   4. Loads folder context.
 *   5. Calls the AI provider.
 *   6. Persists both the user message and AI response.
 *   7. Returns the AI response message.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<SendMessageResult> {
  const response = await authenticatedFetch(
    `/ai/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  const body = await response.json();
  return {
    message: body.message as Message,
    actions: (body.actions ?? []) as SendMessageResult["actions"],
  };
}
