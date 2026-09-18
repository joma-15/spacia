/**
 * constants.ts
 * ─────────────────────────────────────────────
 * Constants, theme tokens, and prompt templates for Spacia AI.
 */

import { QuickPrompt } from "./types";

export const AI_THEME = {
  bg: "#0D1F17",
  surface: "#16281F",
  surfaceAlt: "#1C2F25",
  surfaceElevated: "#23392D",
  primary: "#34D399",
  primaryDim: "rgba(52, 211, 153, 0.14)",
  primarySoft: "rgba(52, 211, 153, 0.08)",
  gold: "#F2C94C",
  goldDim: "rgba(242, 201, 76, 0.15)",
  border: "rgba(255, 255, 255, 0.08)",
  borderBright: "rgba(52, 211, 153, 0.25)",
  textWhite: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.6)",
  textDim: "rgba(255, 255, 255, 0.4)",
  userBubble: "#1B3B2B",
  userBubbleBorder: "rgba(52, 211, 153, 0.3)",
  assistantBubble: "#14251C",
  assistantBubbleBorder: "rgba(255, 255, 255, 0.07)",
};

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "summarize",
    label: "Summarize Topic",
    icon: "text-box-outline",
    prompt: "Can you provide a comprehensive summary of key concepts in this topic?",
    description: "Overview of core points & takeaways",
  },
  {
    id: "quiz",
    label: "Quiz Me",
    icon: "help-circle-outline",
    prompt: "Generate a quick 3-question quiz with multiple choices to test my memory on this topic.",
    description: "Practice questions with explanations",
  },
  {
    id: "simplify",
    label: "Explain Simply",
    icon: "lightbulb-on-outline",
    prompt: "Explain the hardest concept in this topic using a simple, intuitive real-world analogy.",
    description: "Breakdown for quick understanding",
  },
  {
    id: "mnemonic",
    label: "Memory Tricks",
    icon: "brain",
    prompt: "Give me memorable mnemonics and acronyms to easily recall this material for an exam.",
    description: "Acronyms & association cues",
  },
  {
    id: "pitfalls",
    label: "Common Pitfalls",
    icon: "alert-circle-outline",
    prompt: "What are the common misconceptions and tricky exam traps related to this topic?",
    description: "Avoid frequent test mistakes",
  },
];

/**
 * Generates rich mock responses for UI demonstration based on user query and folder context.
 */
export function generateMockAiResponse(
  prompt: string,
  folderName: string,
): string {
  const lower = prompt.toLowerCase();
  const subject = folderName === "All Folders" ? "Study Materials" : folderName;

  if (lower.includes("summarize") || lower.includes("summary")) {
    return `### 📚 Summary: ${subject}\n\nHere is a structured overview of your key study points:\n\n1. **Core Foundations**\n   - Primary definitions and governing principles.\n   - Key terminology used across flashcards.\n\n2. **Critical Relationships**\n   - How variables interact under standard conditions.\n   - Cause-and-effect patterns to remember for tests.\n\n3. **Quick Takeaway**\n   - Focus especially on distinguishing edge cases from general rules.\n\n💡 *Tip: Review your review-status cards in Ninja Rush to lock these into long-term memory!*`;
  }

  if (lower.includes("quiz") || lower.includes("question")) {
    return `### 🎯 Quick Check: ${subject}\n\nHere's a 3-question memory check for you:\n\n**Question 1:** Which factor is considered the primary driver in standard conditions?\n- **A)** External pressure\n- **B)** Equilibrium state\n- **C)** Catalyst threshold\n\n**Question 2:** What is the most common misconception about this mechanism?\n- **A)** It occurs instantaneously\n- **B)** It requires no activation energy\n- **C)** Both A and B\n\n*(Reply with your picks A, B, or C, and I'll break down the right answers!)*`;
  }

  if (lower.includes("mnemonic") || lower.includes("memory")) {
    return `### 🧠 Memory Aid for ${subject}\n\nUse this simple acronym to remember the sequential stages:\n\n**F.A.S.T.**\n- **F** - Foundation & Initial Inputs\n- **A** - Activation & Processing\n- **S** - Stabilization & Feedback\n- **T** - Terminal Output & Synthesis\n\nVisualizing this cycle as a loop will make multiple-choice questions much easier!`;
  }

  if (lower.includes("simplify") || lower.includes("explain")) {
    return `### 💡 Simple Explanation: ${subject}\n\nThink of this concept like an everyday airport terminal:\n\n- **The Passengers:** These are the inputs or reactants waiting to proceed.\n- **The Gate Agents (Catalysts):** They don't fly the planes, but they make boarding 10x faster without getting consumed themselves.\n- **The Flight:** That's the resulting state or reaction.\n\nWhen you see questions about reaction rate, just ask yourself: *how many gate agents are actively assisting right now?*`;
  }

  return `### 🤖 Spacia AI Insights on ${subject}\n\nGreat question! Regarding "${prompt}":\n\n- **Key Point 1:** Make sure to clarify the exact definitions in your flashcards before diving into complex problems.\n- **Key Point 2:** Spaced repetition shows high retention when quizzed within 24 hours of first study.\n\nWould you like me to generate a 3-question quiz, or should we create a new flashcard from this explanation?`;
}
