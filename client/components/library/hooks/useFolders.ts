import { useEffect, useState } from "react";
import type { Folder } from "../types";

const BASE_URL = "http://192.168.8.40:5000";

interface RawFolder {
  id: number | string;
  subject: string;
  accent_color: string;
}

interface FoldersResponse {
  response: RawFolder[];
  cardCount: number;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadFolders = async (): Promise<void> => {
      try {
        const res = await fetch(`${BASE_URL}/folders`);
        const data: FoldersResponse = await res.json();

        if (!isMounted) return;

        const mapped: Folder[] = data.response.map((f) => ({
          id: f.id.toString(),
          subject: f.subject,
          accentColor: f.accent_color,
          cardCount: 0, // backend doesn't compute this per-folder yet
        }));

        if (loading) {
          console.log("still loading");
        }

        setFolders(mapped);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load folders");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFolders();
    return () => { isMounted = false; };
  }, []);

  return { folders, loading, error };
}