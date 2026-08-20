import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "@/shared/config/api";
import {
  getFlashcardsByFolder,
  updateFlashcardStatus,
  replaceFlashcardsForFolder,
} from "@/shared/database/flashcardRepository";
import { CardStatus, FlashCard } from "@/features/flashcards/types";
import { getAccessToken } from "@/shared/components/auth/session";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * One card's quiz result. Recorded locally the moment the player answers,
 * collected across the whole game, then sent to the server as a single
 * batch when the quiz ends.
 */
export interface QuizAnswerRecord {
  cardId: string;
  correct: boolean;
}

/**
 * Quizzy's own version of the SpaceBlast `useFlashcardSync` hook — folder
 * loading is identical (local SQLite first, background refresh from the
 * server). The difference is entirely in how answers get synced:
 *
 *  - SpaceBlast's `handleAnswer` does a local write AND an immediate
 *    `PATCH /flashcards/:id` for every single answer (N network calls
 *    per game).
 *  - Quizzy's `recordAnswerLocally` only does the local SQLite + on-screen
 *    write — safe to call after every question, never touches the network.
 *  - Quizzy's `submitGameResults` sends every answered card's new status
 *    to the server in ONE request, called once when the quiz finishes.
 *
 * This is a separate file on purpose: SpaceBlast's hook and its per-answer
 * sync behavior are untouched.
 */
export function useFlashcardSync(folderId: string) {
  const { cacheOwnerId } = useAuth();
  const userId = cacheOwnerId;
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadCachedCards = useCallback((): FlashCard[] => {
    try {
      if (!userId) {
        setCards([]);
        return [];
      }
      const dbCards = getFlashcardsByFolder(userId, folderId) as any[];
      const mapped: FlashCard[] = dbCards.map((c) => ({
        id: String(c.id),
        question: c.question,
        answer: c.answer,
        status: (c.status as CardStatus) ?? "review",
      }));
      if (isMountedRef.current) setCards(mapped);
      return mapped;
    } catch (e) {
      console.error("Failed to load cached cards:", e);
      return [];
    }
  }, [folderId, userId]);

  const areDecksEqual = (local: FlashCard[], backend: FlashCard[]): boolean => {
    if (local.length !== backend.length) return false;
    const localMap = new Map(local.map((c) => [c.id, c]));
    for (const b of backend) {
      const l = localMap.get(b.id);
      if (!l) return false;
      if (l.question !== b.question || l.answer !== b.answer || l.status !== b.status) return false;
    }
    return true;
  };

  const syncFlashcards = useCallback(async () => {
    if (!userId) {
      setCards([]);
      setIsDataLoading(false);
      return;
    }
    try {
      // 1. Show local SQLite data immediately.
      const local = loadCachedCards();
      if (local.length > 0 && isMountedRef.current) setIsDataLoading(false);

      // 2. Fetch the latest data from the backend.
      const token = await getAccessToken();
      if (!token) throw new Error("No authenticated session");
      const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch from backend");
      const data = await response.json();

      const backend: FlashCard[] = data.map((item: any) => ({
        id: String(item.id),
        question: item.question,
        answer: item.answer,
        status: (item.status as CardStatus) ?? "review",
      }));

      if (!isMountedRef.current) return;

      // 3. If nothing changed, we're done — local data is already correct.
      if (areDecksEqual(local, backend)) {
        setIsDataLoading(false);
        return;
      }

      // 4. Otherwise, save the fresh data locally and update the screen.
      replaceFlashcardsForFolder(userId, folderId, backend.map((card) => ({ ...card, folderId })), "synced");
      if (isMountedRef.current) setCards(backend);
    } catch (error) {
      console.error("Sync failed, falling back to local SQLite cache:", error);
      // No extra handling needed — the local cards loaded in step 1 are
      // already showing.
    } finally {
      if (isMountedRef.current) setIsDataLoading(false);
    }
  }, [folderId, loadCachedCards, userId]);

  useEffect(() => {
    isMountedRef.current = true;
    void syncFlashcards();
    return () => {
      isMountedRef.current = false;
    };
  }, [syncFlashcards]);

  /**
   * Called after every question. Local-only — SQLite write + on-screen
   * state, exactly like SpaceBlast's `handleAnswer` did, minus the network
   * call. Safe to call as often as the game needs; nothing here can be
   * slowed down or interrupted by connection quality.
   */
  const recordAnswerLocally = useCallback(
    (cardId: string, correct: boolean) => {
      if (!userId) return;
      const newStatus: CardStatus = correct ? "understood" : "review";
      try {
        updateFlashcardStatus(userId, cardId, newStatus);
        setCards((prev) =>
          prev.map((card) => (card.id === cardId ? { ...card, status: newStatus } : card)),
        );
      } catch (error) {
        console.error("Failed to record answer locally:", error);
      }
    },
    [userId],
  );

  /**
   * Called once, when the quiz finishes. Sends every answered card's new
   * status to the server in a single request.
   *
   * NOTE: `PATCH /flashcards/batch-status` does not exist yet — this is
   * the minimal new backend endpoint this refactor needs. It should accept
   * `{ updates: { id: string; status: "understood" | "review" }[] }` and
   * apply all of them in one write. If you already have some other bulk-
   * update route, point this at that instead of adding a new one.
   *
   * On failure this throws rather than swallowing the error, so the
   * caller (Quizzy's `onGameComplete`) can decide how to handle it — the
   * quiz itself has already finished locally by this point regardless.
   */
  const submitGameResults = useCallback(
    async (answers: QuizAnswerRecord[]) => {
      if (!userId || answers.length === 0) return;
      const token = await getAccessToken();
      if (!token) return;

      const updates = answers.map(({ cardId, correct }) => ({
        id: cardId,
        status: (correct ? "understood" : "review") as CardStatus,
      }));

      const response = await fetch(`${BASE_URL}/flashcards/batch-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit quiz results to server");
      }
    },
    [userId],
  );

  return { cards, isDataLoading, recordAnswerLocally, submitGameResults };
}