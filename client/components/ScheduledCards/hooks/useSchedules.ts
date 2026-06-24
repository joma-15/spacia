import { useState, useEffect } from "react";
import type { Schedule } from "../types";

const BASE_URL = "http://192.168.8.40:5000";

const dummySchedules: Schedule[] = [
  {
    id: "sched-001",
    folderId: "folder-001",
    folderName: "JavaScript Basics",
    cardIds: ["card-001", "card-002", "card-003"],
    scheduleType: "daily",
    customDays: [],
    time: "08:00",
    durationMinutes: 30,
    intervalMinutes: 5,
    shuffle: true,
    enabled: true,
    createdAt: Date.now(),
  },
  {
    id: "sched-002",
    folderId: "folder-002",
    folderName: "Networking Fundamentals",
    cardIds: ["card-010", "card-011", "card-012", "card-013"],
    scheduleType: "daily",
    customDays: [],
    time: "18:00",
    durationMinutes: 45,
    intervalMinutes: 10,
    shuffle: false,
    enabled: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "sched-003",
    folderId: "folder-003",
    folderName: "Cybersecurity Terms",
    cardIds: ["card-020", "card-021"],
    scheduleType: "custom_days",
    customDays: ["Mon", "Wed", "Tue"],
    time: "20:30",
    durationMinutes: 60,
    intervalMinutes: 15,
    shuffle: true,
    enabled: true,
    createdAt: Date.now() - 172800000,
  },
  {
    id: "sched-004",
    folderId: "folder-004",
    folderName: "ASP.NET Core",
    cardIds: ["card-030", "card-031", "card-032", "card-033"],
    scheduleType: "one_time",
    customDays: [],
    time: "09:00",
    durationMinutes: 90,
    intervalMinutes: 20,
    shuffle: true,
    enabled: false,
    createdAt: Date.now() - 259200000,
  },
  {
    id: "sched-005",
    folderId: "folder-005",
    folderName: "Probability & Statistics",
    cardIds: ["card-040", "card-041", "card-042"],
    scheduleType: "custom_days",
    customDays: ["Tue", "Mon"],
    time: "14:00",
    durationMinutes: 40,
    intervalMinutes: 8,
    shuffle: false,
    enabled: false,
    createdAt: Date.now() - 345600000,
  },
];

const fetchData = async () : Promise<Schedule[]> => {
  try {
    const response = await fetch(`${BASE_URL}/schedules`); 

    if (!response.ok) {
      throw new Error("error fetching data to the database");
    }
    const result = await response.json(); 
    console.log(result); 

    return result.data
  } catch (error) {
    console.log(error); 
    return[];
  }
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const loadSchedules = async () => {
      const data = await fetchData();
      setSchedules(data);
    };

    loadSchedules();
  }, []);

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