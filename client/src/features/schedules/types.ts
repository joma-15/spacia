/** A persisted study reminder. Keep schedule-specific types with this feature. */
export type Schedule = {
  id: number;
  folderId: number;
  folderName: string;
  cardIds: number[];
  scheduleType: string;
  customDays: string[];
  time: string;
  durationMinutes: number;
  intervalMinutes: number;
  shuffle: boolean;
  enabled: boolean;
  createdAt: string;
};
