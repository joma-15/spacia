# Word Rush Game (Placeholder) (`/client/src/features/games/WordRush`)

## 1. Overview

**Word Rush** is a planned speed-spelling and completion game designed to test spelling and recall of flashcard definitions.
* **Purpose**: Solidify term retrieval and spelling memory under time limits.
* **Learning Objective**: Given a definition, spell the matching term correctly before the timer runs out.
* **Current Status**: This game is currently a **placeholder screen** awaiting implementation of gameplay logic.

---

## 2. Folder Structure

```text
client/src/features/games/WordRush/
├── index.ts                 # Entry point re-exporting the screen
├── WordRush.tsx             # Screen skeleton placeholder
└── README.md
```

---

## 3. Implementation Roadmap & AI Guidance

To develop this placeholder game, follow the established game architectures:

### 1. Data Prep
* Consume `folderId` from the route params and retrieve card arrays via `getFlashcardsByFolder(folderId)`.
* Shuffle the card deck to randomize the quiz order.

### 2. Gameplay Loop & UI
* Display a definition (answer) as a prompt.
* Render empty letter tiles for the question term.
* Provide either a scrambled letter pool (scrabble-style buttons) or interface with the system keyboard to let the user spell the term.
* Run a global countdown timer (e.g. 15-30 seconds per word).
* Checking inputs:
  * If spelled correctly, trigger celebration micro-animations, play success sound, and proceed to the next word. Update card state in SQLite to `'understood'`.
  * If the timer runs out or spelling is incorrect, show the correct answer, count it as a review card, and reduce active lives.

### 3. SQLite & Server Syncing
* Ensure all correct answers trigger `updateFlashcardStatus(cardId, 'understood')` and push background sync updates to the server via `PATCH /flashcards/:id` for seamless offline-first performance.
