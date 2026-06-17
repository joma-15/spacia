/**
 * useFlashCards
 * Central state and business logic for the flashcard feature.
 * Manages CRUD operations, tab filtering, and AI card fetching.
 */

import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { FlashCard, CardStatus, TabType } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.8.40:5000";

export function useFlashCards(folderId: string) {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(false);
  const CACHE_KEY = `flashcards_${folderId}`;

  // ── Auto-load existing cards on mount ─────────────────────────────────────
  useEffect(() => {
    if (folderId) {
      loadCachedCards();
      loadSavedCards();
    }
  }, [folderId]);

  //change the local storage whenever the card is change 
  useEffect(() => {
    if (!folderId) return;

    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cards)).catch((err) =>
      console.error("Error saving cache:", err),
    );
  }, [cards, folderId]);

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

  /** Mark a card as understood */
  const handleUnderstand = (id: string) =>
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "understood" as CardStatus } : c,
      ),
    );

  /** Move a card back to review */
  const handleMoveToReview = (id: string) =>
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "review" as CardStatus } : c,
      ),
    );

  /** Remove a single card by id */
  const handleDelete = (id: string) =>
    setCards((prev) => prev.filter((c) => c.id !== id));

  /** Update question/answer for an existing card */
  const handleEdit = (id: string, question: string, answer: string) =>
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, question, answer } : c)),
    );

  /** Prepend a brand-new card to the list */
  const handleAddCard = (question: string, answer: string) => {
    setCards((prev) => [
      { id: Date.now().toString(), question, answer, status: "review" },
      ...prev,
    ]);
  };

  /** Remove every card and reset the active tab */
  const handleDeleteAll = () => {
    setCards([]);
    setActiveTab("all");
  };

  // ── Loaders ────────────────────────────────────────────────────────────────
  //loads existing cards from the local storage
  const loadCachedCards = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);

      if (cached) {
        const parsedCards: FlashCard[] = JSON.parse(cached);

        setCards(parsedCards);

        console.log("Loaded flashcards from cache");
      }
    } catch (error) {
      console.error("Error loading cached cards:", error);
    }
  };

  /** Silently loads already-saved cards from DB on mount (no AI call) */
  const loadSavedCards = async () => {
    try {
      const response = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`);
      const data = await response.json();

      if (!response.ok || data.error) return;

      const saved: FlashCard[] = data.map((item: any) => ({
        id: String(item.id),
        question: item.question,
        answer: item.answer,
        status: (item.status as CardStatus) ?? "review",
      }));

      setCards(saved);

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(saved));
    } catch (error) {
      console.error("Error loading saved cards:", error);
    } finally {
      setLoading(false);
    }
  };

  /** AI button: generates NEW cards via Groq and merges them in */
  const fetchAiCards = async () => {
    setLoading(true);
    try {
      // 1. Kick off background generation
      const triggerResponse = await fetch(`${BASE_URL}/flashcards/${folderId}`);
      const triggerText = await triggerResponse.text();
      console.log("Trigger status:", triggerResponse.status);
      console.log("Trigger response:", triggerText);

      // 2. Poll /saved every 2 seconds
      let attempts = 0;
      const maxAttempts = 15;

      const poll = setInterval(async () => {
        attempts++;
        console.log(`Polling attempt ${attempts}...`);
        try {
          const response = await fetch(
            `${BASE_URL}/flashcards/${folderId}/saved`,
          );
          console.log("Poll status:", response.status);
          const text = await response.text();
          console.log("Poll response:", text);

          const data = JSON.parse(text);

          if (Array.isArray(data) && data.length > 0) {
            const newCards: FlashCard[] = data.map((item: any) => ({
              id: String(item.id),
              question: item.question,
              answer: item.answer,
              status: (item.status as CardStatus) ?? "review",
            }));

            setCards((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const fresh = newCards.filter((c) => !existingIds.has(c.id));
              return fresh.length > 0 ? [...fresh, ...prev] : prev;
            });

            clearInterval(poll);
            setLoading(false);
          }

          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setLoading(false);
            Alert.alert("Timeout", "Generation is taking too long, try again.");
          }
        } catch (pollError) {
          console.error("Poll error:", pollError); // 👈 shows exact poll failure
          clearInterval(poll);
          setLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error("Trigger error:", error); // 👈 shows exact trigger failure
      Alert.alert("Error", "Failed to generate flashcards.");
      setLoading(false);
    }
  };
  return {
    // state
    cards,
    activeTab,
    loading,
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
    fetchAiCards, // 👈 called by AI button, no args needed
  };
}
