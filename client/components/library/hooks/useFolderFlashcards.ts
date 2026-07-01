import { useEffect, useState } from "react";
import type { Flashcard } from "../types";

const BASE_URL = "http://192.168.8.33:5000";

interface RawFlashcard {
  id: number | string;
  question: string;
  answer: string;
  folder_id: number | string;
  status: string;
}

export function useFolderFlashcards(folderId: string | null) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folderId) {
      setCards([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadCards = async (): Promise<void> => {
      try {
        const res = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`);
        const raw: RawFlashcard[] = await res.json();

        if (!isMounted) return;

        const mapped: Flashcard[] = raw.map((c) => ({
          id: c.id.toString(),
          folderId: c.folder_id.toString(),
          question: c.question,
          answer: c.answer,
        }));

        setCards(mapped);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load flashcards");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCards();
    return () => { isMounted = false; };
  }, [folderId]);

  return { cards, loading, error };
}