/** App-wide color tokens for the flashcard feature */

export const COLORS = {
  background: "#0f1f1a",
  surface: "#1a2e28",
  surfaceElevated: "#1f3530",
  primary: "#2ecc71",
  primaryDim: "#1a7a45",
  text: "#e8f5e9",
  textMuted: "#7a9e8a",
  tagBlue: "#1a3a5c",
  tagBlueBorder: "#2980b9",
  tagGreen: "#1a4a2e",
  tagGreenBorder: "#27ae60",
  tagOrange: "#4a2e0a",
  tagOrangeBorder: "#e67e22",
  danger: "#c0392b",
  dangerDim: "#7b241c",
  dangerBorder: "#c0392b",
  border: "#2a4a3a",
  premiumPurple: "#1e1035",
  premiumPurpleBorder: "#7c3aed",
  premiumPurpleText: "#c4b5fd",
  premiumGold: "#f59e0b",
  premiumGoldDim: "#78350f",
} as const;

/** Premium feature list shown in the PremiumModal */
export const PREMIUM_FEATURES = [
  { icon: "✦", text: "Generate cards from any topic or pasted text" },
  { icon: "✦", text: "Smart difficulty levels auto-assigned per card" },
  { icon: "✦", text: "Bulk generate entire study decks in seconds" },
  { icon: "✦", text: "AI detects gaps and suggests missing cards" },
];

/** Tab definitions for the card filter row */
export const TABS: { key: import("./types").TabType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "review", label: "Review" },
  { key: "understood", label: "Done" },
];