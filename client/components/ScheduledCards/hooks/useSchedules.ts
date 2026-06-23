// import { useState } from "react";
// import type { Schedule } from "../../library/types";

// export function useSchedules() {
//   const [schedules, setSchedules] = useState<Schedule[]>([]);

//   const addSchedule = (schedule: Schedule): void =>
//     setSchedules((prev) => [schedule, ...prev]);

//   const deleteSchedule = (id: string): void =>
//     setSchedules((prev) => prev.filter((s) => s.id !== id));

//   const toggleSchedule = (id: string): void =>
//     setSchedules((prev) =>
//       prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
//     );

//   const duplicateSchedule = (id: string): void =>
//     setSchedules((prev) => {
//       const original = prev.find((s) => s.id === id);
//       if (!original) return prev;
//       const copy: Schedule = { ...original, id: Date.now().toString(), createdAt: Date.now() };
//       return [copy, ...prev];
//     });

//   return { schedules, addSchedule, deleteSchedule, toggleSchedule, duplicateSchedule };
// }

import { useState } from "react";
import type { Schedule } from "../../library/types";

// Dummy data so the UI has something to render. Remove once real data flows in.
const DUMMY_SCHEDULES: Schedule[] = [
  {
    id: "dummy-1",
    folderId: "folder-1",
    folderName: "Biology Midterm",
    cardIds: ["card-1", "card-2", "card-3"],
    scheduleType: "custom_days",
    customDays: ["Mon", "Wed", "Fri"],
    time: "08:00",
    durationMinutes: 15,
    intervalMinutes: 30,
    shuffle: true,
    enabled: true,
    createdAt: Date.now(),
  },
  {
    id: "dummy-2",
    folderId: "folder-2",
    folderName: "Spanish Vocab",
    cardIds: ["card-4", "card-5"],
    scheduleType: "custom_days",
    customDays: ["Tue", "Thu"],
    time: "18:30",
    durationMinutes: 10,
    intervalMinutes: 20,
    shuffle: false,
    enabled: false,
    createdAt: Date.now(),
  },
];
export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>(DUMMY_SCHEDULES);

  const addSchedule = (schedule: Schedule): void =>
    setSchedules((prev) => [schedule, ...prev]);

  const deleteSchedule = (id: string): void =>
    setSchedules((prev) => prev.filter((s) => s.id !== id));

  const toggleSchedule = (id: string): void =>
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );

  const duplicateSchedule = (id: string): void =>
    setSchedules((prev) => {
      const original = prev.find((s) => s.id === id);
      if (!original) return prev;
      const copy: Schedule = { ...original, id: Date.now().toString(), createdAt: Date.now() };
      return [copy, ...prev];
    });

  return { schedules, addSchedule, deleteSchedule, toggleSchedule, duplicateSchedule };
}