import { useState } from "react";
import type { Schedule } from "../types";

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const addSchedule = (schedule: Schedule): void =>
    setSchedules((prev) => [schedule, ...prev]);

  const deleteSchedule = (id: string): void =>
    setSchedules((prev) => prev.filter((s) => s.id !== id));

  const toggleSchedule = (id: string): void =>
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );

  const duplicateSchedule = (id: string): void =>
    setSchedules((prev) => {
      const original = prev.find((s) => s.id === id);
      if (!original) return prev;
      const copy: Schedule = {
        ...original,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      return [copy, ...prev];
    });

  return {
    schedules,
    addSchedule,
    deleteSchedule,
    toggleSchedule,
    duplicateSchedule,
  };
}
