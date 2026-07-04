/**
 * useFlashCards
 * Central state and business logic for the flashcard feature.
 * Manages CRUD operations, tab filtering, and AI card fetching.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, InteractionManager } from "react-native";
import { FlashCard, CardStatus, TabType } from "../types";
import {
  saveFlashcards,
  getFlashcardsByFolder,
  deleteFlashcard,
  updateFlashcardStatus,
} from "../../../src/database/flashcardRepository";

const BASE_URL = "http://192.168.8.39:5000";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

export function useFlashCards(folderId: string) {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Tracks the in-flight request/poll so we can cancel stale work
  // (folder switched, screen unmounted) instead of letting it clobber state.
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedIdsRef = useRef<string>("");

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const mapApiCard = (item: any): FlashCard => ({
    id: String(item.id),
    question: item.question,
    answer: item.answer,
    status: (item.status as CardStatus) ?? "review",
  });

  // ── Load existing cards on mount / folder change ───────────────────────────
  useEffect(() => {
    if (!folderId) return;

    // Cancel anything still running for a previous folder.
    abortRef.current?.abort();
    clearPoll();

    const controller = new AbortController();
    abortRef.current = controller;

    //show the modal 
    setInitialLoading(true);

    // The SQLite read is synchronous. Running it immediately on mount blocks
    // the JS thread mid-navigation-transition, which is what causes the
    // "tap a folder, screen feels delayed" lag. Deferring it until after the
    // transition animation finishes makes the navigation feel instant, and
    // the cards simply pop in a beat later.
    const task = InteractionManager.runAfterInteractions(() => {
      loadCachedCards();
      loadSavedCards(controller.signal);
    });

    return () => {
      task.cancel?.();
      controller.abort();
      clearPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const reviewCards = cards.filter((c) => c.status === "review");
  const understoodCards = cards.filter((c) => c.status === "understood");
  const progress = cards.length > 0 ? understoodCards.length / cards.length : 0;

  const displayedCards =
    activeTab === "all"
      ? cards
      : activeTab === "review"
        ? reviewCards
        : understoodCards;

  // ── Card mutations ─────────────────────────────────────────────────────────

  const updateCardStatus = useCallback(async (id: string, newStatus: CardStatus) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );

    try {
      const response = await fetch(`${BASE_URL}/flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update backend");

      updateFlashcardStatus(id, newStatus);
    } catch (error) {
      console.error("Status update failed:", error);
    }
  }, []);

  const handleUnderstand = useCallback(
    (id: string) => updateCardStatus(id, "understood"),
    [updateCardStatus],
  );

  const handleMoveToReview = useCallback(
    (id: string) => updateCardStatus(id, "review"),
    [updateCardStatus],
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/flashcards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        deleteFlashcard(id);
        setCards((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, []);

  /** Update question/answer for an existing card */
  const handleEdit = useCallback(
    (id: string, question: string, answer: string) =>
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, question, answer } : c)),
      ),
    [],
  );

  const handleAddCard = useCallback(
    async (question: string, answer: string) => {
      try {
        const response = await fetch(
          `${BASE_URL}/flashcards/${folderId}/manualSaved`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question,
              answer,
              status: "review",
              folderIdd: folderId,
            }),
          },
        );

        if (response.ok) {
          await loadSavedCards();
        }
      } catch (error) {
        console.error("Add card failed:", error);
      }
    },
    [folderId],
  );

  /** Remove every card and reset the active tab */
  // const handleDeleteAll = useCallback(() => {
  //   setCards([]);
  //   setActiveTab("all");
  // }, []);

  const handleDeleteAll = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/flashcards/folder/${folderId}`, {
        method: "DELETE",
      }); 

      if (response.ok) {
        setCards([]); 
        setActiveTab("all");
      }
    } catch (error) {
      console.log(error)
    }
  },[]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  const loadCachedCards = useCallback(() => {
    try {
      const cached = getFlashcardsByFolder(folderId);

      const parsedCards: FlashCard[] = cached.map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        status: card.status,
      }));

      setCards(parsedCards);
    } catch (error) {
      console.error("Failed to load cached cards:", error);
    }
  }, [folderId]);

  /** Silently loads already-saved cards from DB on mount (no AI call) */
  const loadSavedCards = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, {
          signal,
        });

        const data = await response.json();
        if (!response.ok || data.error) return;

        const saved: FlashCard[] = data.map(mapApiCard);

        setCards(saved);

        // Skip the SQLite rewrite entirely if nothing actually changed —
        // avoids a needless write on every folder open.
        const idsSignature = saved.map((c) => `${c.id}:${c.status}`).join(",");
        if (idsSignature !== lastSavedIdsRef.current) {
          lastSavedIdsRef.current = idsSignature;
          await saveFlashcards(saved.map((card) => ({ ...card, folderId })));
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return; // folder changed/unmounted, ignore
        console.error("Error loading saved cards:", error);
      } finally {
        setInitialLoading(false);
      }
    },
    [folderId],
  );

  /** AI button: generates NEW cards via Groq and merges them in */
  const fetchAiCards = useCallback(async () => {
    setLoading(true);
    clearPoll();

    try {
      await fetch(`${BASE_URL}/flashcards/${folderId}`);

      let attempts = 0;

      pollRef.current = setInterval(async () => {
        attempts++;

        try {
          const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`);
          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            const newCards = data.map(mapApiCard);

            setCards((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const fresh = newCards.filter((c) => !existingIds.has(c.id));
              return fresh.length > 0 ? [...fresh, ...prev] : prev;
            });

            clearPoll();
            setLoading(false);
            return;
          }

          if (attempts >= MAX_POLL_ATTEMPTS) {
            clearPoll();
            setLoading(false);
            Alert.alert("Timeout", "Generation is taking too long, try again.");
          }
        } catch (pollError) {
          console.error("Poll error:", pollError);
          clearPoll();
          setLoading(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (error) {
      console.error("Trigger error:", error);
      Alert.alert("Error", "Failed to generate flashcards.");
      setLoading(false);
    }
  }, [folderId, clearPoll]);

  return {
    // state
    cards,
    activeTab,
    loading,
    initialLoading,
    // derived
    reviewCards,
    understoodCards,
    displayedCards,
    progress,
    // actions
    setActiveTab,
    handleUnderstand,
    handleMoveToReview,
    handleDelete,
    handleEdit,
    handleAddCard,
    handleDeleteAll,
    fetchAiCards,
  };
}