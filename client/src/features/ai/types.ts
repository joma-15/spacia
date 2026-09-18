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
