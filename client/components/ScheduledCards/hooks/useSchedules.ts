import { useState, useEffect, useCallback, useRef } from "react";
import type { Schedule } from "../types";
import { loadLocalSchedule, saveNewSchedules, deleteLocalSchedule } from "@/database/scheduleRepository";

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = "http://192.168.8.33:5000";
const FETCH_TIMEOUT_MS = 8000;

// ─── Module-level cache (persists across unmount/remount) ─────────────────────
let scheduleCache: Schedule[] | null = null;

// ─── Fetcher ──────────────────────────────────────────────────────────────────
const fetchData = async (signal: AbortSignal): Promise<Schedule[]> => {
  const response = await fetch(`${BASE_URL}/schedules`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch schedules: ${response.status}`);
  }

  const result = await response.json();
  return result.data ?? [];
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSchedules() {
  // Lazy init from cache — avoids blank flash on remount
  const [schedules, setSchedules] = useState<Schedule[]>(() => scheduleCache ?? []);
  const [loading, setLoading] = useState(scheduleCache === null);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();

    const syncSchedules = async () => {
      // ── Step 1: Load from SQLite and show immediately ──────────────────────
      const localData = await loadLocalSchedule();

      if (isMountedRef.current && localData.length > 0) {
        setSchedules(localData);
        scheduleCache = localData;
      } else {
        // No local data yet — show spinner while waiting for backend
        setLoading(true);
      }

      // ── Step 2: Fetch from backend ─────────────────────────────────────────
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const backendData = await fetchData(controller.signal);
        clearTimeout(timeoutId);

        // ── Step 3: Save only new schedules, then update UI ──────────────────
        const localIds = new Set(localData.map((s) => s.id));
        const newSchedules = backendData.filter((s) => !localIds.has(s.id));

        if (newSchedules.length > 0) {
          await saveNewSchedules(newSchedules);
          const merged = [...localData, ...newSchedules];

          if (isMountedRef.current) {
            setSchedules(merged);
            scheduleCache = merged;
          }
        }

        if (isMountedRef.current) setError(null);
      } catch (err) {
        clearTimeout(timeoutId);

        if (isMountedRef.current) {
          const isTimeout = err instanceof Error && err.name === "AbortError";
          setError(
            isTimeout
              ? "Request timed out — check your connection"
              : "Could not load schedules"
          );
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    syncSchedules();

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, []);

  const toggleSchedule = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update backend (${response.status})`);
      }

      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/schedules/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete schedule (${response.status})`);
    }

    // 1. Delete from SQLite
    await deleteLocalSchedule(id);

    // 2. Update React state and cache
    setSchedules((prev) => {
      const updated = prev.filter((schedule) => schedule.id !== id);
      scheduleCache = updated;
      return updated;
    });

  } catch (error) {
    console.error(error);
  }
}, []);

  return {
    schedules,
    loading,
    deleteSchedule,
    error,
    toggleSchedule,
  };
}