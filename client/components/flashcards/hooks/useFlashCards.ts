/**
 * useFlashCards
 * Central state and business logic for the flashcard feature.
 * Manages CRUD operations, tab filtering, and AI card fetching.
 */

import { useState } from "react";
import { Alert } from "react-native";
import { FlashCard, CardStatus, TabType } from "../types";

export function useFlashCards() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(false);

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
      prev.map((c) => (c.id === id ? { ...c, status: "understood" as CardStatus } : c))
    );

  /** Move a card back to review */
  const handleMoveToReview = (id: string) =>
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "review" as CardStatus } : c))
    );

  /** Remove a single card by id */
  const handleDelete = (id: string) =>
    setCards((prev) => prev.filter((c) => c.id !== id));

  /** Update question/answer for an existing card */
  const handleEdit = (id: string, question: string, answer: string) =>
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, question, answer } : c))
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

  // ── AI fetch ───────────────────────────────────────────────────────────────

  /** Fetch AI-generated flashcards from the local backend and merge them in */
  const fetchAiCards = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://192.168.8.35:5000/flashcards");
      const data = await response.json();

      const newCards: FlashCard[] = data.flashcards.map((item: any) => ({
        id: item.id ?? Date.now().toString() + Math.random(),
        question: item.question,
        answer: item.answer,
        status: (item.status as CardStatus) ?? "review",
      }));

      setCards((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const fresh = newCards.filter((c) => !existingIds.has(c.id));
        return [...fresh, ...prev];
      });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      Alert.alert("Error", "Failed to fetch flashcards.");
    } finally {
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
    fetchAiCards,
  };
}