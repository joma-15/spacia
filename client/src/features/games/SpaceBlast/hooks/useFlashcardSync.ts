import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "@/shared/config/api";
import { getFlashcardsByFolder, updateFlashcardStatus, replaceFlashcardsForFolder } from "@/shared/database/flashcardRepository";
import { CardStatus, FlashCard } from "../types";
import { getAccessToken } from "@/shared/components/auth/session";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Loads a folder's flashcards for gameplay, offline-first:
 *  1. Reads whatever is already saved locally in SQLite, so the game
 *     can start right away without waiting on the network.
 *  2. In the background, fetches the latest version from the server
 *     and updates local storage + on-screen state if anything changed.
 *
 * Also exposes `handleAnswer`, which is what the game calls every time
 * the player answers a question — it updates SQLite immediately, then
 * pushes the change to the server without blocking the game.
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
      const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleAnswer = useCallback(async (cardId: string, correct: boolean) => {
    if (!userId) return;
    const newStatus: CardStatus = correct ? "understood" : "review";
    try {
      // Update local SQLite first (offline-first).
      updateFlashcardStatus(userId, cardId, newStatus);
      setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, status: newStatus } : card)));

      // Then push the change to the server in the background.
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`${BASE_URL}/flashcards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update flashcard status on server");
    } catch (error) {
      console.error("Failed to update flashcard status:", error);
    }
  }, [userId]);

  return { cards, isDataLoading, handleAnswer };
}
