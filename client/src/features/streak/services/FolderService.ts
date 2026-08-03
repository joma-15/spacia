// ============================================================================
// Spacia — FolderService
// Mimics `GET /api/folders`.
// ============================================================================

import { mockFolders } from "../data/folders";
import { Folder } from "../types";

const NETWORK_DELAY_MS = 400;

function delay<T>(value: T, ms: number = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const FolderService = {
  /** GET /api/folders */
  async getFolders(): Promise<Folder[]> {
    return delay(mockFolders.map((folder) => ({ ...folder })));
  },
};
