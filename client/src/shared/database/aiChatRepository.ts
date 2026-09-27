/**
 * aiChatRepository.ts
 * ─────────────────────────────────────────────
 * SQLite cache for AI conversations and their messages.
 *
 * Strategy: cache-then-network
 *   1. On tab open → read from SQLite immediately (zero network latency).
 *   2. In background → fetch from server, write back to SQLite.
 *   3. UI updates silently when fresh data arrives.
 *
 * Tables used (created in database.ts):
 *   ai_conversations  — one row per conversation
 *   ai_messages       — one row per message, FK to ai_conversations
 */

import { db } from "./database";
import type { Conversation, Message } from "@/features/ai/types";

// ─── Conversations ─────────────────────────────────────────────────────────────

/**
 * Persist a conversation returned from the server.
 * Uses INSERT OR REPLACE so re-syncing is idempotent.
 */
export function saveConversation(userId: string, conv: Conversation): void {
  db.runSync(
    `INSERT OR REPLACE INTO ai_conversations
       (id, user_id, folder_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      conv.id,
      userId,
      conv.folderId ?? null,
      conv.title,
      conv.createdAt,
      conv.updatedAt,
    ],
  );
}

/**
 * Return the most-recently updated conversation for the given user + folder.
 * Pass `folderId = null` to target the "general" (no-folder) conversation.
 */
export function getCachedConversation(
  userId: string,
  folderId: string | null,
): Conversation | null {
  const row = db.getFirstSync(
    `SELECT id, folder_id, title, created_at, updated_at
       FROM ai_conversations
      WHERE user_id = ?
        AND (folder_id = ? OR (folder_id IS NULL AND ? IS NULL))
      ORDER BY updated_at DESC
      LIMIT 1`,
    [userId, folderId, folderId],
  ) as {
    id: string;
    folder_id: string | null;
    title: string;
    created_at: string;
    updated_at: string;
  } | null;

  if (!row) return null;
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Messages ──────────────────────────────────────────────────────────────────

/**
 * Bulk-upsert messages for a conversation.
 * Safe to call with an empty array.
 */
export function saveMessages(messages: Message[]): void {
  if (!messages.length) return;
  db.withTransactionSync(() => {
    for (const msg of messages) {
      db.runSync(
        `INSERT OR REPLACE INTO ai_messages
           (id, conversation_id, role, content, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [msg.id, msg.conversationId, msg.role, msg.content, msg.createdAt],
      );
    }
  });
}

/**
 * Append a single new message (optimistic or confirmed) to the cache.
 */
export function saveMessage(msg: Message): void {
  db.runSync(
    `INSERT OR REPLACE INTO ai_messages
       (id, conversation_id, role, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [msg.id, msg.conversationId, msg.role, msg.content, msg.createdAt],
  );
}

/**
 * Return all user/assistant messages for a conversation, oldest first.
 */
export function getCachedMessages(conversationId: string): Message[] {
  const rows = db.getAllSync(
    `SELECT id, conversation_id, role, content, created_at
       FROM ai_messages
      WHERE conversation_id = ?
        AND role IN ('user', 'assistant')
      ORDER BY created_at ASC`,
    [conversationId],
  ) as {
    id: string;
    conversation_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  }));
}

/**
 * Replace all cached messages for a conversation with a fresh server snapshot.
 * Called after a successful network fetch to keep the cache in sync.
 */
export function replaceMessages(
  conversationId: string,
  messages: Message[],
): void {
  db.withTransactionSync(() => {
    db.runSync(
      "DELETE FROM ai_messages WHERE conversation_id = ?",
      [conversationId],
    );
    for (const msg of messages) {
      db.runSync(
        `INSERT INTO ai_messages
           (id, conversation_id, role, content, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [msg.id, msg.conversationId, msg.role, msg.content, msg.createdAt],
      );
    }
  });
}

/**
 * Delete a conversation and all its messages from the cache.
 */
export function deleteCachedConversation(conversationId: string): void {
  db.withTransactionSync(() => {
    db.runSync(
      "DELETE FROM ai_messages WHERE conversation_id = ?",
      [conversationId],
    );
    db.runSync(
      "DELETE FROM ai_conversations WHERE id = ?",
      [conversationId],
    );
  });
}
