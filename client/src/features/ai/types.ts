/**
 * types.ts
 * ─────────────────────────────────────────────
 * TypeScript definitions for the Spacia AI study assistant feature.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  folderId?: string;
  folderName?: string;
  isThinking?: boolean;
  actions?: AiAction[];
}

/** A server-confirmed action performed by the assistant. */
export interface AiAction {
  type: string;
  result: Record<string, unknown>;
}

export interface QuickPrompt {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  description: string;
}

export interface SelectedFolderContext {
  id: string | null; // null = "All Folders / General Study"
  name: string;
  cardCount: number;
  accentColor: string;
}

// --- Backend API shapes ---

/** Matches the `to_dict()` output of AiConversation on the server. */
export interface Conversation {
  id: string;
  folderId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/** Matches the `to_dict()` output of AiMessage on the server. */
export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SendMessageResult {
  message: Message;
  actions: AiAction[];
}
