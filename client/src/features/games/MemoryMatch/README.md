# Memory Match Game (Placeholder) (`/client/src/features/games/MemoryMatch`)

## 1. Overview

**Memory Match** is a planned grid-based card matching game designed to reinforce flashcard recall.
* **Purpose**: Train spatial memory alongside active term recognition.
* **Learning Objective**: Flip cards to match terms (questions) with their definitions (answers) in the fewest moves.
* **Current Status**: This game is currently a **placeholder screen**. It renders a simple back button and title card, awaiting implementation of gameplay logic.

---

## 2. Folder Structure

```text
client/src/features/games/MemoryMatch/
├── index.ts                 # Entry point re-exporting the screen
├── MemoryMatch.tsx          # Screen skeleton placeholder
└── README.md
```

---

## 3. Implementation Roadmap & AI Guidance

When implementing this game, follow the architecture established by other games in the codebase:

### 1. Data Retrieval & Setup
* Load folder parameters (`folderId` and `folderName`) from the route search parameters.
* Fetch cards locally from SQLite using `getFlashcardsByFolder(folderId)`.
* Enforce a card minimum (e.g. at least 6-8 cards to make a $4 \times 3$ or $4 \times 4$ grid). If there are not enough cards, display a warning modal with a redirect to the library.

### 2. Matching Grid Logic
* For the selected cards, create card representations for both the Term (question) and definition (answer) (e.g., 6 cards yield 12 grid items).
* Shuffle the grid using the Fisher-Yates algorithm.
* Maintain states for `flippedIndices` (up to 2 active card selections) and `matchedPairs` (set of matching IDs).
* When two cards are flipped:
  * Compare their term and definition keys.
  * If they match, add them to `matchedPairs` and trigger success animations. If the session finishes, show a completion modal and update their statuses to `'understood'` using `updateFlashcardStatus()`.
  * If they mismatch, wait $1$ second and flip them back down.

### 3. Synchronization
* On successful card match, update local SQLite databases via `updateFlashcardStatus(cardId, 'understood')` and push changes to the server backend using `PATCH /flashcards/:id`.
