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
  saveFlashcards,
  getFlashcardsBySyncStatus,
  deleteAllFlashcardsForFolder,
} from "@/shared/database/flashcardRepository";
import { uuidv4 } from "@/shared/database/database";
import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL } from "@/shared/config/api";
import { getAccessToken } from "@/shared/components/auth/session";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authenticatedFetch } from "@/shared/services/authenticatedFetch";

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
  const { cacheOwnerId } = useAuth();
  const userId = cacheOwnerId;
  // ── States ──
  // The list of flashcards in the folder
  const [cards, setCards] = useState<FlashCard[]>(() => {
    try {
      if (!userId || !folderId) return [];
      const cached = getFlashcardsByFolder(userId, folderId);
      return cached.map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        status: card.status,
      }));
    } catch {
      return [];
    }
  });
  // Active filter tab: 'all', 'review' (needs study), or 'understood' (completed)
  const [activeTab, setActiveTab] = useState<TabType>("all");
  // True when performing a slow background action like generating cards via AI
  const [loading, setLoading] = useState(false);
  // True only when the folder is opened with NO local cached cards
  const [initialLoading, setInitialLoading] = useState(() => cards.length === 0);

  // ── Reference Objects (Refs) ──
  // Refs act like persistent variables that do NOT trigger screen refreshes when changed.
  // 1. abortRef: Used to cancel running network requests if the user navigates away mid-load.
  const abortRef = useRef<AbortController | null>(null);
  // 2. pollRef: Timer reference for handling automatic retries or status checks.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 3. lastSavedIdsRef: Signature of the last list of card IDs we saved to SQLite. Avoids redrawing when nothing changed.
  const lastSavedIdsRef = useRef<string>("");
  // 4. isMountedRef: Tracks if the screen is currently open. Prevents updating state after user exited the screen.
  const isMountedRef = useRef(false);

  // Clears the active polling timer if one is running
  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const syncPendingFlashcards = useCallback(async (fId: string) => {
    try {
      const token = await getAccessToken();
      if (!token || !userId) return;
      // 1. Process pending creations
      const pendingCreates = getFlashcardsBySyncStatus(userId, "pending_create") as any[];
      const folderPendingCreates = pendingCreates.filter(c => c.folder_id === fId);
      for (const card of folderPendingCreates) {
        const response = await authenticatedFetch(
          `/flashcards/${fId}/manualSaved`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: card.id,
              question: card.question,
              answer: card.answer,
              status: card.status || "review",
              folderIdd: fId,
            }),
          },
        );
        if (response.ok) {
          saveFlashcards(userId, [
            {
              id: card.id,
              folderId: fId,
              question: card.question,
              answer: card.answer,
              status: card.status || "review",
            }
          ], "synced");
        }
      }

      // 2. Process pending deletions
      const pendingDeletes = getFlashcardsBySyncStatus(userId, "pending_delete") as any[];
      const folderPendingDeletes = pendingDeletes.filter(c => c.folder_id === fId);
      for (const card of folderPendingDeletes) {
        const response = await authenticatedFetch(`/flashcards/${card.id}`, { method: "DELETE" });
        if (response.ok) {
          deleteFlashcard(userId, card.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync flashcards with server:", error);
    }
  }, [userId]);

  // Helper function: Converts card data received from the backend API structure 
  // into the standard TypeScript format used inside our React Native screens.
  const mapApiCard = (item: any): FlashCard => ({
    id: String(item.id),
    question: item.question,
    answer: item.answer,
    status: (item.status as CardStatus) ?? "review",
  });

  // ── Derived State (useMemo) ──────────────────────────────────────────────────
  // useMemo stores ("caches") the result of a calculation.
  // Instead of filtering the cards list on every single frame/render, React only 
  // recalculates these lists when the main 'cards' list actually changes.

  // Filter out cards that are marked as needing review
  const reviewCards = useMemo(
    () => cards.filter((c) => c.status === "review"),
    [cards],
  );

  // Filter out cards that are marked as understood
  const understoodCards = useMemo(
    () => cards.filter((c) => c.status === "understood"),
    [cards],
  );

  // Calculate the study completion percentage (number of understood cards divided by total cards)
  const progress = cards.length > 0 ? understoodCards.length / cards.length : 0;

  // Determines which cards list to draw on screen based on the current filter tab
  const displayedCards = useMemo(() => {
    if (activeTab === "all") return cards;
    if (activeTab === "review") return reviewCards;
    return understoodCards;
  }, [activeTab, cards, reviewCards, understoodCards]);

  // ── Card Mutations ─────────────────────────────────────────────────────────

  // Updates the study state (review or understood) of a specific flashcard.
  // It uses "optimistic UI rendering" — it updates the local screen state instantly 
  // so the user feels no lag, and sends the request to the server in the background.
  const updateCardStatus = useCallback(async (id: string, newStatus: CardStatus) => {
    // Eagerly update screen state
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );

    // Save changes to local database cache for offline availability immediately
    if (!userId) return;
    updateFlashcardStatus(userId, id, newStatus);

    try {
      // Send changes to the backend
      const token = await getAccessToken();
      if (!token) return;
      const response = await authenticatedFetch(`/flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update backend");
    } catch (error) {
      console.error("Status update failed:", error);
    }
  }, [userId]);

  const handleUnderstand = useCallback(
    (id: string) => updateCardStatus(id, "understood"),
    [updateCardStatus],
  );

  const handleMoveToReview = useCallback(
    (id: string) => updateCardStatus(id, "review"),
    [updateCardStatus],
  );

  const handleDelete = useCallback(async (id: string) => {
    if (!userId) return;
    // Eagerly update UI state
    setCards((prev) => prev.filter((c) => c.id !== id));

    // Eagerly update SQLite cache
    deleteFlashcard(userId, id);

    // Perform sync in background
    void syncPendingFlashcards(folderId);
  }, [folderId, syncPendingFlashcards, userId]);

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

  // Deletes every single flashcard inside this subject folder.
  const handleDeleteAll = useCallback(async () => {
    if (!userId) return;
    // Eagerly update SQLite cache
    try {
      deleteAllFlashcardsForFolder(userId, folderId);
    } catch (e) {
      console.error("Failed to delete all local flashcards:", e);
    }

    // Clear screen state and reset the tab back to 'all'
    setCards([]); 
    setActiveTab("all");

    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await authenticatedFetch(`/flashcards/folder/${folderId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete all flashcards on server");
      }
    } catch (error) {
      console.error("Delete all backend sync failed:", error);
    }
  }, [folderId, userId]);

  // ── Data Syncing and Cache Loading ──────────────────────────────────────────

  // Pulls flashcards from the local SQLite database on the phone.
  // This is used if the server is offline or loading too slowly.
  const loadCachedCards = useCallback((): boolean => {
    try {
      if (!userId) {
        setCards([]);
        return false;
      }
      const cached = getFlashcardsByFolder(userId, folderId);

      const parsedCards: FlashCard[] = cached.map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        status: card.status,
      }));

      setCards(parsedCards);
      return parsedCards.length > 0; // Return true if we actually loaded cards
    } catch (error) {
      console.error("Failed to load cached cards:", error);
      return false;
    }
  }, [folderId, userId]);

  const loadSavedCards = useCallback(
    async (signal?: AbortSignal, loadCacheOnFailure = false) => {
      const token = await getAccessToken();
      if (!userId) {
        setCards([]);
        return;
      }
      if (!token) {
        loadCachedCards();
        if (isMountedRef.current) setInitialLoading(false);
        return;
      }
      // Create a timeout controller to cancel the request if it takes longer than 8 seconds (FETCH_TIMEOUT_MS)
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), FETCH_TIMEOUT_MS);

      // If the parent component cancels this work externally, abort our network request immediately
      const onExternalAbort = () => timeoutController.abort();
      signal?.addEventListener("abort", onExternalAbort);

      try {
        const response = await authenticatedFetch(`/flashcards/${folderId}/saved`, {
          signal: timeoutController.signal, // Link abort signal
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error("Failed to load saved flashcards from the server.");
        }

        const saved: FlashCard[] = data.map(mapApiCard);

        if (!isMountedRef.current) return;

        // Save server cards to cache (only replacing synced cards)
        replaceFlashcardsForFolder(userId, folderId, saved.map((card) => ({ ...card, folderId })), "synced");

        // Run background sync for pending creations/deletes
        void syncPendingFlashcards(folderId);

        // Load merged list from SQLite cache (synced + pending)
        loadCachedCards();
      } catch (error) {
        // If we canceled the request on purpose, don't show any error messages.
        if ((error as Error)?.name === "AbortError") return;
        console.error("Error loading saved cards:", error);
        
        // If server failed, fall back to offline cache
        if (loadCacheOnFailure && isMountedRef.current) {
          loadCachedCards();
        }
      } finally {
        // Always clean up timers and listeners when finished
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onExternalAbort);
        if (isMountedRef.current) {
          setInitialLoading(false);
        }
      }
    },
    [folderId, loadCachedCards, syncPendingFlashcards, userId],
  );

  const handleAddCard = useCallback(
    async (question: string, answer: string) => {
      if (!userId) return;
      const newId = uuidv4();
      const newCard: FlashCard = {
        id: newId,
        question: question.trim(),
        answer: answer.trim(),
        status: "review",
      };

      // Eagerly update screen state
      setCards((prev) => [...prev, newCard]);

      // Eagerly save to SQLite cache as pending
      saveFlashcards(userId,
        [
          {
            id: newId,
            folderId,
            question: question.trim(),
            answer: answer.trim(),
            status: "review",
          },
        ],
        "pending_create"
      );

      // Perform background sync (non-blocking)
      void syncPendingFlashcards(folderId);
    },
    [folderId, syncPendingFlashcards, userId],
  );

  // ── Load existing cards on mount / folder change ───────────────────────────
  // ── Screen Mount / Folder Change Side Effects ──
  useEffect(() => {
    isMountedRef.current = true;

    if (!folderId || !userId) {
      setCards([]);
      setInitialLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    // Stop and clean up any network requests or timers that are still running 
    // from a previously selected folder.
    abortRef.current?.abort();
    clearPoll();

    // Create a new cancellation signal for this folder's load request
    const controller = new AbortController();
    abortRef.current = controller;

    // Load from local SQLite cache first
    const hasCache = loadCachedCards();
    if (!hasCache) {
      setInitialLoading(true);
    }

    // Delay the network request until the screen slide animation completes
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isMountedRef.current || controller.signal.aborted) return;
      void loadSavedCards(controller.signal, true);
    });

    // Cleanup function: runs when the component unmounts or folderId changes
    return () => {
      isMountedRef.current = false;
      task.cancel?.();      // Cancel pending interaction task
      controller.abort();   // Cancel running fetch request
      clearPoll();          // Stop active timers
    };
  }, [folderId, clearPoll, loadCachedCards, loadSavedCards, userId]);

  /** 
   * Uploads a textbook document (PDF/Word) to the backend server and triggers 
   * the AI generation service. Once completed, it reloads the new flashcards list.
   */
  const fetchAiCards = useCallback(async (file: TextbookUpload): Promise<boolean> => {
    if (!folderId || !isMountedRef.current || !userId) return false;

    setLoading(true);
    clearPoll();

    try {
      // Upload the PDF or DOCX file using Expo's legacy FileSystem utility.
      // Uses "MULTIPART" format (similar to an HTML form file upload).
      const token = await getAccessToken();
      if (!token) return false;
      const uploadResult = await FileSystem.uploadAsync(
        `${BASE_URL}/flashcards/${folderId}`,
        file.uri,
        {
          fieldName: "file",
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: file.mimeType ?? "application/pdf",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let data: any = null;
      try {
        data = JSON.parse(uploadResult.body);
      } catch (e) {
        console.error("Failed to parse response body:", e);
      }

      // Check HTTP status code (200-299 is success)
      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(data?.error ?? "Failed to generate flashcards.");
      }

      if (isMountedRef.current) {
        // Success: refresh the list to load the newly generated flashcards from server
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
  }, [folderId, clearPoll, loadSavedCards, userId]);

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
