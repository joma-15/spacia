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
 * Only flashcards still in "review" status are returned to the game —
 * already-understood cards are filtered out so they never appear as
 * questions or floating answer targets.
 *
 * Answer syncing uses a two-phase approach (matching Quizzy):
 *  - `handleAnswer`       → local-only (SQLite + React state). Safe to call
 *                           on every answer; never touches the network.
 *  - `submitGameResults`  → called ONCE at game end. Sends only the
 *                           understood card IDs in a single batch request.
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
      const mapped: FlashCard[] = dbCards
        .map((c) => ({
          id: String(c.id),
          question: c.question,
          answer: c.answer,
          status: (c.status as CardStatus) ?? "review",
        }))
        // Only expose cards that still need review — understood cards are
        // already learned and must not appear in the game (req. 6 & 11).
        .filter((c) => c.status === "review");
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
      // 1. Show local SQLite data immediately (filtered to review-only).
      const local = loadCachedCards();
      if (local.length > 0 && isMountedRef.current) setIsDataLoading(false);

      // 2. Fetch the latest data from the backend.
      const token = await getAccessToken();
      if (!token) throw new Error("No authenticated session");
      const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to fetch from backend");
      const data = await response.json();

      const backendAll: FlashCard[] = data.map((item: any) => ({
        id: String(item.id),
        question: item.question,
        answer: item.answer,
        status: (item.status as CardStatus) ?? "review",
      }));

      // Filter to review-only for the game, but persist the full set locally
      // so the local cache stays in sync with the server truth.
      const backendReview = backendAll.filter((c) => c.status === "review");

      if (!isMountedRef.current) return;

      // 3. If nothing changed among review cards, we're done.
      if (areDecksEqual(local, backendReview)) {
        setIsDataLoading(false);
        return;
      }

      // 4. Otherwise, save the fresh data locally and update the screen.
      replaceFlashcardsForFolder(userId, folderId, backendAll.map((card) => ({ ...card, folderId })), "synced");
      if (isMountedRef.current) setCards(backendReview);
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
   * state. Never touches the network, so it is always instant regardless
   * of connection quality.
   *
   * Cards newly marked "understood" are removed from the visible deck so
   * they cannot be selected again in the same game session (req. 12).
   */
  const handleAnswer = useCallback(
    (cardId: string, correct: boolean) => {
      if (!userId) return;
      const newStatus: CardStatus = correct ? "understood" : "review";
      try {
        updateFlashcardStatus(userId, cardId, newStatus);
        setCards((prev) => {
          const updated = prev.map((card) =>
            card.id === cardId ? { ...card, status: newStatus } : card,
          );
          // Remove newly understood cards from the active deck so the
          // engine never picks them again within this session.
          return correct ? updated.filter((card) => card.id !== cardId) : updated;
        });
      } catch (error) {
        console.error("Failed to record answer locally:", error);
      }
    },
    [userId],
  );

  /**
   * Called ONCE when the game reaches a terminal state (win or game over).
   * Sends only the understood card IDs in a single batch request.
   *
   * If there are zero understood cards, no network request is made (req. 18).
   * Uses PATCH /flashcards/batch-status — the same endpoint used by Quizzy.
   *
   * Throws on failure so the caller can decide how to handle the error;
   * the game has already finished locally by this point.
   */
  const submitGameResults = useCallback(
    async (understoodCardIds: string[]) => {
      if (!userId || understoodCardIds.length === 0) return;
      const token = await getAccessToken();
      if (!token) return;

      const updates = understoodCardIds.map((id) => ({ id, status: "understood" as CardStatus }));

      const response = await fetch(`${BASE_URL}/flashcards/batch-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit game results to server");
      }
    },
    [userId],
  );

  return { cards, isDataLoading, handleAnswer, submitGameResults };
}
