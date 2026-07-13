/**
 * useFlashCards
 * Central state and business logic for the flashcard feature.
 * Manages CRUD operations, tab filtering, and AI card fetching.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, InteractionManager } from "react-native";
import { FlashCard, CardStatus, TabType } from "../types";
import {
  replaceFlashcardsForFolder,
  getFlashcardsByFolder,
  deleteFlashcard,
  updateFlashcardStatus,
} from "@/shared/database/flashcardRepository";
import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL } from "@/shared/config/api";

// const BASE_URL = "http://192.168.8.39:5000";
const FETCH_TIMEOUT_MS = 8000;

export interface TextbookUpload {
  /** Expo's file picker supplies a local URI, display name, and optional MIME type. */
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number;
}

export function useFlashCards(folderId: string) {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Tracks in-flight work so a response for an old folder cannot overwrite the
  // state after the user navigates to a different folder.
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedIdsRef = useRef<string>("");
  const isMountedRef = useRef(false);

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

  // ── Derived state ──────────────────────────────────────────────────────────

  const reviewCards = useMemo(
    () => cards.filter((c) => c.status === "review"),
    [cards],
  );
  const understoodCards = useMemo(
    () => cards.filter((c) => c.status === "understood"),
    [cards],
  );
  const progress = cards.length > 0 ? understoodCards.length / cards.length : 0;

  const displayedCards = useMemo(() => {
    if (activeTab === "all") return cards;
    if (activeTab === "review") return reviewCards;
    return understoodCards;
  }, [activeTab, cards, reviewCards, understoodCards]);

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

  const loadCachedCards = useCallback((): boolean => {
    // Cache is deliberately a fallback. Rendering it before the server caused
    // stale totals to flash while the current folder data was still loading.
    try {
      const cached = getFlashcardsByFolder(folderId);

      const parsedCards: FlashCard[] = cached.map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        status: card.status,
      }));

      setCards(parsedCards);
      return parsedCards.length > 0;
    } catch (error) {
      console.error("Failed to load cached cards:", error);
      return false;
    }
  }, [folderId]);

  /** Loads the server copy first; local cards are an offline fallback. */
  const loadSavedCards = useCallback(
    async (signal?: AbortSignal, loadCacheOnFailure = false) => {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), FETCH_TIMEOUT_MS);

      const onExternalAbort = () => timeoutController.abort();
      signal?.addEventListener("abort", onExternalAbort);

      try {
        const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, {
          signal: timeoutController.signal,
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error("Failed to load saved flashcards from the server.");
        }

        const saved: FlashCard[] = data.map(mapApiCard);

        if (!isMountedRef.current) return;
        setCards(saved);

        // Skip the SQLite rewrite entirely if nothing actually changed —
        // avoids a needless write on every folder open.
        const idsSignature = saved.map((c) => `${c.id}:${c.status}`).join(",");
        if (idsSignature !== lastSavedIdsRef.current) {
          lastSavedIdsRef.current = idsSignature;
          replaceFlashcardsForFolder(folderId, saved.map((card) => ({ ...card, folderId })));
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.error("Error loading saved cards:", error);
        if (loadCacheOnFailure && isMountedRef.current) {
          loadCachedCards();
        }
      } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onExternalAbort);
        if (isMountedRef.current) {
          setInitialLoading(false);
        }
      }
    },
    [folderId, loadCachedCards],
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
    [folderId, loadSavedCards],
  );

  // ── Load existing cards on mount / folder change ───────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    if (!folderId) {
      setInitialLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    // Cancel anything still running for a previous folder.
    abortRef.current?.abort();
    clearPoll();

    const controller = new AbortController();
    abortRef.current = controller;

    setInitialLoading(true);

    // Wait until the navigation transition ends before starting the sync.
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isMountedRef.current || controller.signal.aborted) return;

      const shouldShowCacheBeforeServer = false;
      if (shouldShowCacheBeforeServer) {
        // Cached cards are on screen — don't block the UI on a slow network sync.
        setInitialLoading(false);
      }
      void loadSavedCards(controller.signal, true);
    });

    return () => {
      isMountedRef.current = false;
      task.cancel?.();
      controller.abort();
      clearPoll();
    };
  }, [folderId, clearPoll, loadCachedCards, loadSavedCards]);

  /** Uploads a textbook and generates cards from that file. */
  // const fetchAiCards = useCallback(async (file: TextbookUpload): Promise<boolean> => {
  //   if (!folderId || !isMountedRef.current) return false;

  //   setLoading(true);
  //   clearPoll();

  //   try {
  //     const fsFile = new FileSystemFile(file.uri);
  //     const response = await fsFile.upload(
  //       `${BASE_URL}/flashcards/${folderId}`,
  //       {
  //         fieldName: "file",
  //         httpMethod: "POST",
  //         uploadType: UploadType.MULTIPART,
  //       }
  //     );

  //     let data: any = null;
  //     try {
  //       data = JSON.parse(response.body);
  //     } catch (e) {
  //       console.error("Failed to parse response body:", e);
  //     }

  //     if (response.status < 200 || response.status >= 300) {
  //       throw new Error(data?.error ?? "Failed to generate flashcards.");
  //     }

  //     if (isMountedRef.current) {
  //       await loadSavedCards();
  //     }
  //     return true;
  //   } catch (error) {
  //     console.error("Trigger error:", error);
  //     if (isMountedRef.current) {
  //       Alert.alert("Generation failed", (error as Error).message);
  //     }
  //     return false;
  //   } finally {
  //     if (isMountedRef.current) setLoading(false);
  //   }
  // }, [folderId, clearPoll, loadSavedCards]);

 const fetchAiCards = useCallback(async (file: TextbookUpload): Promise<boolean> => {
  if (!folderId || !isMountedRef.current) return false;

  setLoading(true);
  clearPoll();

  try {
    const uploadResult = await FileSystem.uploadAsync(
      `${BASE_URL}/flashcards/${folderId}`,
      file.uri,
      {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: file.mimeType ?? "application/pdf",
        parameters: {
          // any extra form fields your Flask route expects, e.g.:
          // filename: file.name,
        },
      }
    );

    let data: any = null;
    try {
      data = JSON.parse(uploadResult.body);
    } catch (e) {
      console.error("Failed to parse response body:", e);
    }

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(data?.error ?? "Failed to generate flashcards.");
    }

    if (isMountedRef.current) {
      await loadSavedCards();
    }
    return true;
  } catch (error) {
    console.error("Trigger error:", error);
    if (isMountedRef.current) {
      Alert.alert("Generation failed", (error as Error).message);
    }
    return false;
  } finally {
    if (isMountedRef.current) setLoading(false);
  }
}, [folderId, clearPoll, loadSavedCards]);

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
