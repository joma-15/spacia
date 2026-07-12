/**
 * constants.ts
 * ─────────────────────────────────────────────
 * Static data that never changes at runtime.
 *
 * Keeping these here (not inside components) means:
 *  - They are never re-created on every render
 *  - Multiple components can import them without prop-drilling
 */

import type { NavTab, Perk, PricingPlan } from "./types";

// ─── Pricing ──────────────────────────────────────────────────────────────────

/** Prices for each billing plan */
export const PRICING: Record<"monthly" | "annual", PricingPlan> = {
  monthly: {
    amount:  2.5,
    display: "$2.50/mo",
  },
  annual: {
    amount:   25.0,
    display:  "$25.00/yr",
    perMonth: "$2.08/mo",
  },
};

/**
 * How much cheaper annual is compared to paying monthly for 12 months.
 * Formula: ((monthly × 12 - annual) / (monthly × 12)) × 100
 * Result:  17%
 */
export const SAVINGS_PERCENT = Math.round(
  ((PRICING.monthly.amount * 12 - PRICING.annual.amount) /
    (PRICING.monthly.amount * 12)) *
    100
);

// ─── Premium feature sections ─────────────────────────────────────────────────

/** The three feature sections shown on the payment screen */
export const PERKS: Perk[] = [
  {
    emoji: "🤖",
    title: "AI-Powered Learning",
    items: [
      "Unlimited AI Flashcard Generation",
      "Generate up to 50 flashcards at once",
      "Regenerate flashcards anytime",
      "Higher quality AI flashcards",
    ],
  },
  {
    emoji: "📄",
    title: "Study From Any Material",
    items: [
      "Import PDFs",
      "Turn lecture notes into flashcards",
      "Convert study guides into quizzes",
      "Extract key concepts automatically",
    ],
  },
  {
    emoji: "🧠",
    title: "Smarter Studying",
    items: [
      "Spaced Repetition System",
      "Smart Review Recommendations",
      "Progress Tracking",
      "Study Streaks",
    ],
  },
];

// ─── Bottom navigation items ──────────────────────────────────────────────────

/** Every tab in the bottom navigation bar */
export const NAV_ITEMS: {
  id: NavTab;
  label: string;
  emoji: string;
  isCenter?: boolean;
}[] = [
  { id: "profile", label: "Profile", emoji: "👤"             },
  { id: "streak",  label: "Streak",  emoji: "🔥"             },
  { id: "add",     label: "",        emoji: "+", isCenter: true },
  { id: "popup",   label: "Library", emoji: "📂"             },
  { id: "stats",   label: "Premium", emoji: "👑"             },
];