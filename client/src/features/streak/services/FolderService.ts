import { getFolders } from "@/shared/database/folderRepository";
import { getCardStatsPerFolder } from "@/shared/database/flashcardRepository";
import { authenticatedFetch } from "@/shared/services/authenticatedFetch";
import { Folder } from "../types";

interface SourceFolder {
  id: string;
  subject: string;
  accentColor?: string;
  accent_color?: string;
  cardCount?: number;
  reviewCardCount?: number;
  understoodCardCount?: number;
}

function toDashboardFolder(folder: SourceFolder, counts?: {
  totalCards: number;
  reviewCards: number;
  understoodCards: number;
}): Folder {
  return {
    id: String(folder.id),
    title: folder.subject,
    color: folder.accentColor ?? folder.accent_color ?? "#6B7280",
    icon: "folder-outline",
    totalCards: counts?.totalCards ?? folder.cardCount ?? 0,
    reviewCards: counts?.reviewCards ?? folder.reviewCardCount ?? 0,
    understoodCards: counts?.understoodCards ?? folder.understoodCardCount ?? 0,
    lastStudied: "",
  };
}

export const FolderService = {
  getLocalFolders(userId: string): Folder[] {
    const cardStats = getCardStatsPerFolder(userId);
    return (getFolders(userId) as SourceFolder[]).map((folder) =>
      toDashboardFolder(folder, cardStats[String(folder.id)]),
    );
  },

  async getRemoteFolders(): Promise<Folder[]> {
    const response = await authenticatedFetch("/folders");
    const body = (await response.json()) as { response?: SourceFolder[] };
    return (body.response ?? []).map((folder) => toDashboardFolder(folder));
  },
};
