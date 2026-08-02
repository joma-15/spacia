import { useEffect, useState } from "react";
import type { Flashcard } from "../types";
import { BASE_URL } from "@/shared/config/api";
import { getAccessToken } from "@/shared/components/auth/session";
import { useAuth } from "@/features/auth/hooks/useAuth";

// const BASE_URL = "http://192.168.8.39:5000";

interface RawFlashcard {
  id: number | string;
  question: string;
  answer: string;
  folder_id: number | string;
  status: string;
}

export function useFolderFlashcards(folderId: string | null) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folderId || !user) {
      setCards([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadCards = async (): Promise<void> => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(`${BASE_URL}/flashcards/${folderId}/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load flashcards");
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
  }, [folderId, user]);

  return { cards, loading, error };
}
