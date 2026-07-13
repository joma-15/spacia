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
  // ── States ──
  // The list of flashcards in the folder
  const [cards, setCards] = useState<FlashCard[]>([]);
  // Active filter tab: 'all', 'review' (needs study), or 'understood' (completed)
  const [activeTab, setActiveTab] = useState<TabType>("all");
  // True when performing a slow background action like generating cards via AI
  const [loading, setLoading] = useState(false);
  // True when the folder is first opened and loading its cards for the first time
  const [initialLoading, setInitialLoading] = useState(false);

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

    try {
      // Send changes to the backend
      const response = await fetch(`${BASE_URL}/flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update backend");

      // Save changes to local database cache for offline availability
      updateFlashcardStatus(id, newStatus);
    } catch (error) {
      console.error("Status update failed:", error);
      // NOTE: In a production app, we would revert the screen state here if the network failed!
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

  // Deletes every single flashcard inside this subject folder.
  const handleDeleteAll = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/flashcards/folder/${folderId}`, {
        method: "DELETE",
      }); 

      if (response.ok) {
        // Clear screen state and reset the tab back to 'all'
        setCards([]); 
        setActiveTab("all");
      }
    } catch (error) {
      console.log(error);
    }
  }, [folderId]);

  // ── Data Syncing and Cache Loading ──────────────────────────────────────────

  // Pulls flashcards from the local SQLite database on the phone.
  // This is used if the server is offline or loading too slowly.
  const loadCachedCards = useCallback((): boolean => {
    try {
      const cached = getFlashcardsByFolder(folderId);

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
  }, [folderId]);

  /** 
   * Fetches the official cards list from the backend server.
   * If the fetch request fails (e.g. no internet), it falls back to the local database cache.
   */
  const loadSavedCards = useCallback(
    async (signal?: AbortSignal, loadCacheOnFailure = false) => {
      // Create a timeout controller to cancel the request if it takes longer than 8 seconds (FETCH_TIMEOUT_MS)
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), FETCH_TIMEOUT_MS);

      // If the parent component cancels this work externally, abort our network request immediately
      const onExternalAbort = () => timeoutController.abort();
      signal?.addEventListener("abort", onExternalAbort);

      try {
        const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, {
          signal: timeoutController.signal, // Link abort signal
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error("Failed to load saved flashcards from the server.");
        }

        const saved: FlashCard[] = data.map(mapApiCard);

        if (!isMountedRef.current) return;
        setCards(saved);

        // Smart cache saving: compare the signatures of loaded cards.
        // We only overwrite the local SQLite database if the cards list actually changed,
        // which saves mobile CPU battery and read/write cycles.
        const idsSignature = saved.map((c) => `${c.id}:${c.status}`).join(",");
        if (idsSignature !== lastSavedIdsRef.current) {
          lastSavedIdsRef.current = idsSignature;
          replaceFlashcardsForFolder(folderId, saved.map((card) => ({ ...card, folderId })));
        }
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
  // ── Screen Mount / Folder Change Side Effects ──
  useEffect(() => {
    isMountedRef.current = true;

    if (!folderId) {
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

    setInitialLoading(true);

    // Performance Optimization: React Native's InteractionManager.
    // We delay the network request until the screen slide animation completes.
    // This makes sure the screen feels fast and smooth, without dropping frames.
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isMountedRef.current || controller.signal.aborted) return;

      const shouldShowCacheBeforeServer = false;
      if (shouldShowCacheBeforeServer) {
        setInitialLoading(false);
      }
      void loadSavedCards(controller.signal, true);
    });

    // Cleanup function: runs when the component unmounts or folderId changes
    return () => {
      isMountedRef.current = false;
      task.cancel?.();      // Cancel pending interaction task
      controller.abort();   // Cancel running fetch request
      clearPoll();          // Stop active timers
    };
  }, [folderId, clearPoll, loadCachedCards, loadSavedCards]);

  /** 
   * Uploads a textbook document (PDF/Word) to the backend server and triggers 
   * the AI generation service. Once completed, it reloads the new flashcards list.
   */
  const fetchAiCards = useCallback(async (file: TextbookUpload): Promise<boolean> => {
    if (!folderId || !isMountedRef.current) return false;

    setLoading(true);
    clearPoll();

    try {
      // Upload the PDF or DOCX file using Expo's legacy FileSystem utility.
      // Uses "MULTIPART" format (similar to an HTML form file upload).
      const uploadResult = await FileSystem.uploadAsync(
        `${BASE_URL}/flashcards/${folderId}`,
        file.uri,
        {
          fieldName: "file",
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: file.mimeType ?? "application/pdf",
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
