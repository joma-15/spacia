// ============================================================================
// Spacia — useQuote
// Selects a random motivational quote on mount, and a new one every time
// `nextQuote()` is called (used by pull-to-refresh).
// ============================================================================

import { useCallback, useState } from "react";
import { getRandomQuote } from "../constants/quotes";

interface UseQuoteResult {
  quote: string;
  nextQuote: () => void;
}

export function useQuote(): UseQuoteResult {
  const [quote, setQuote] = useState<string>(() => getRandomQuote());

  const nextQuote = useCallback(() => {
    setQuote((current) => getRandomQuote(current));
  }, []);

  return { quote, nextQuote };
}
