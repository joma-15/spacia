import { useState, useEffect, useCallback, useRef } from "react";
import type { Schedule } from "../types";

const BASE_URL = "http://192.168.8.40:5000";
const FETCH_TIMEOUT_MS = 8000;

// Module-level in-memory cache — survives unmount/remount, avoids refetch flicker
let scheduleCache: Schedule[] | null = null;

const fetchData = async (signal: AbortSignal): Promise<Schedule[]> => {
  const response = await fetch(`${BASE_URL}/schedules`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch schedules: ${response.status}`);
  }

  const result = await response.json();
  return result.data ?? [];
};

export function useSchedules() {
  // Lazy init from cache so there's no blank flash if we already have data
  const [schedules, setSchedules] = useState<Schedule[]>(
    () => scheduleCache ?? [],
  );
  const [loading, setLoading] = useState(scheduleCache === null);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Already have cached data — skip the loading spinner, just refresh quietly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const loadSchedules = async () => {
      try {
        if (scheduleCache === null) setLoading(true);
        const data = await fetchData(controller.signal);
        clearTimeout(timeoutId);

        scheduleCache = data;
        if (isMountedRef.current) {
          setSchedules(data);
          setError(null);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (isMountedRef.current) {
          const message =
            err instanceof Error && err.name === "AbortError"
              ? "Request timed out — check your connection"
              : "Could not load schedules";
          setError(message);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    loadSchedules();

    return () => {
      isMountedRef.current = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const data = await fetchData(controller.signal);
      scheduleCache = data;
      setSchedules(data);
      setError(null);
    } catch {
      setError("Could not refresh schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  const addSchedule = useCallback((schedule: Schedule): void => {
    setSchedules((prev) => {
      const next = [schedule, ...prev];
      scheduleCache = next;
      return next;
    });
  }, []);

  const deleteSchedule = useCallback((id: string): void => {
    setSchedules((prev) => {
      const next = prev.filter((s) => s.id !== id);
      scheduleCache = next;
      return next;
    });
  }, []);

  // const toggleSchedule = useCallback((id: string): void => {
  //   setSchedules((prev) => {
  //     const next = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
  //     scheduleCache = next;
  //     return next;
  //   });
  // }, []);

  const toggleSchedule = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      try {
        const response = await fetch(`${BASE_URL}/schedules/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log("Status:", response.status);
          console.log("Response:", errorText);
          throw new Error(`Failed to update backend (${response.status})`);
        }

        // Update local state
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
        );
      } catch (error) {
        console.error(error);
      }
    },
    [],
  );

  // const duplicateSchedule = useCallback((id: string): void => {
  //   setSchedules((prev) => {
  //     const original = prev.find((s) => s.id === id);
  //     if (!original) return prev;

  //     const copy: Schedule = {
  //       ...original,
  //       id: Date.now().toString(),
  //       createdAt: Date.now(),
  //     };

  //     const next = [copy, ...prev];
  //     scheduleCache = next;
  //     return next;
  //   });
  // }, []);

  return {
    schedules,
    loading,
    error,
    refresh,
    addSchedule,
    deleteSchedule,
    toggleSchedule,
    // duplicateSchedule,
  };
}
