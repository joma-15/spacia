import { getCardStatsPerFolder } from "@/shared/database/flashcardRepository";
import { getCachedFolders, loadFolders } from "@/shared/services/folderDataService";
import { FetchPolicy } from "@/shared/services/resourceStore";
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
    return (getCachedFolders(userId) as SourceFolder[]).map((folder) =>
      toDashboardFolder(folder, cardStats[String(folder.id)]),
    );
  },

  async getRemoteFolders(userId: string, policy: FetchPolicy = "stale-while-revalidate"): Promise<Folder[]> {
    return (await loadFolders(userId, policy)).map((folder) => toDashboardFolder(folder));
  },
};
