import { useState, useMemo } from "react";
import type { Folder, Flashcard } from "../../library/types";
import type { SendSchedule, ScheduleType, DayOfWeek } from "../types";
import { saveNewSchedules } from "@/database/scheduleRepository";

const TOTAL_STEPS = 4;
const BASE_URL = "http://192.168.8.33:5000";

const createSchedule = async (schedule: SendSchedule) => {
  try {
    const response = await fetch(`${BASE_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    });

    if (!response.ok) {
      throw new Error("Failed to create schedule");
    }
    const result = await response.json();
    saveNewSchedules(result.data);

    console.log("Backend response:", result);
    console.log("Returned schedule:", result.data);
    console.log("Returned ID:", result.data.id);

    await saveNewSchedules(result.data);

    console.log("schedule set successfully");
  } catch (error) {
    console.error(error);
  }
};

export function useScheduleWizard() {
  const [step, setStep] = useState<number>(0); // 0=Folder,1=Cards,2=Schedule,3=Review

  // Step 1
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  // Step 2
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Step 3
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
  const [customDays, setCustomDays] = useState<DayOfWeek[]>([]);
  const [time, setTime] = useState<string>("20:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);
  const [shuffle, setShuffle] = useState<boolean>(true);

  // Gatekeeps the "Continue" button per step
  const canContinue = useMemo(() => {
    if (step === 0) return selectedFolder !== null;
    if (step === 1) return selectedCardIds.length > 0;
    if (step === 2)
      return scheduleType !== "custom_days" || customDays.length > 0;
    return true;
  }, [step, selectedFolder, selectedCardIds, scheduleType, customDays]);

  const goNext = (): void => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goBack = (): void => setStep((s) => Math.max(s - 1, 0));

  const toggleCard = (id: string): void => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const selectAllCards = (allCards: Flashcard[]): void =>
    setSelectedCardIds(allCards.map((c) => c.id));

  const deselectAllCards = (): void => setSelectedCardIds([]);

  const toggleCustomDay = (day: DayOfWeek): void => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  /** Builds the final Schedule object once the user confirms on the Review step */
  const buildSchedule = (): SendSchedule | null => {
    if (!selectedFolder) return null;
    return {
      // id : "burat",
      folderId: selectedFolder.id,
      folderName: selectedFolder.subject,
      cardIds: selectedCardIds,
      scheduleType,
      customDays,
      time,
      durationMinutes,
      intervalMinutes,
      shuffle,
      enabled: true,
      createdAt: Date.now(),
    };
  };

  const handleSubmit = async () => {
    const schedule = buildSchedule();

    if (schedule) {
      await createSchedule(schedule);
    }
  };

  const reset = (): void => {
    setStep(0);
    setSelectedFolder(null);
    setSelectedCardIds([]);
    setScheduleType("daily");
    setCustomDays([]);
    setTime("20:00");
    setDurationMinutes(60);
    setIntervalMinutes(10);
    setShuffle(true);
  };

  return {
    step,
    goNext,
    goBack,
    canContinue,
    TOTAL_STEPS,
    selectedFolder,
    setSelectedFolder,
    selectedCardIds,
    toggleCard,
    selectAllCards,
    deselectAllCards,
    scheduleType,
    setScheduleType,
    customDays,
    toggleCustomDay,
    time,
    setTime,
    durationMinutes,
    setDurationMinutes,
    intervalMinutes,
    setIntervalMinutes,
    shuffle,
    setShuffle,
    buildSchedule,
    handleSubmit,
    reset,
  };
}
