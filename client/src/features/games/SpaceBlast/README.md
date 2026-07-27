# Space Blast Game (`/client/src/features/games/SpaceBlast`)

## 1. Overview

**Space Blast** is a Quizlet-Blast-style shooting gallery flashcard game.
* **Purpose**: Reinforce vocabulary, definitions, and concepts through fast active recall.
* **Learning Objective**: Read the question, tap the floating bubble with the correct answer before running out of lives, and clear the whole deck.
* **Gameplay Summary**: A spaceship sits at the bottom of the screen. Real answers (pulled from the flashcard deck, never invented) float around as "space rocks." Tapping the correct one fires a bullet, destroys it, and moves to the next question. Tapping a wrong one costs a life. Lose all lives and it's game over; clear every card and you win.

---

## 2. Folder Structure

```text
client/src/features/games/SpaceBlast/
├── components/                     # Small, visual-only pieces (no game logic)
│   ├── AnswerBubble.tsx            # One floating "space rock" showing a possible answer
│   ├── Bullet.tsx                  # The bullet flying from the ship to a tapped bubble
│   ├── CornerFrame.tsx             # Reusable sci-fi corner decoration for cards/modals
│   ├── Explosion.tsx               # One-shot explosion effect where a bubble was hit
│   ├── GameHeader.tsx              # Back button + folder-switch pill
│   ├── GameOverModal.tsx           # Popup shown when lives run out
│   ├── LivesRow.tsx                # Heart icons showing remaining lives
│   ├── LoadingOverlay.tsx          # Full-screen loading spinner
│   ├── MinCardsModal.tsx           # Popup shown when the folder has too few cards
│   ├── QuestionCard.tsx            # Bottom HUD panel showing the current question
│   ├── ShootingStar.tsx            # Decorative background shooting star
│   ├── Spaceship.tsx               # The player's ship image
│   ├── Star.tsx                    # One twinkling background star
│   ├── WinModal.tsx                # Popup shown when the whole deck is cleared
│   └── modalStyles.ts              # Styles shared by the three popup modals
├── hooks/                          # All game logic and data-loading lives here
│   ├── useAssetPreload.ts          # Preloads images before the game can start
│   ├── useBullets.ts               # Fires bullets, tracks explosions
│   ├── useDeckProgress.ts          # Tracks current card, lives, win/game-over state
│   ├── useFlashcardSync.ts         # Loads flashcards from SQLite, syncs with backend
│   ├── useFloatingAnswers.ts       # Manages the board of floating answer bubbles
│   └── useSpaceBlastEngine.ts      # Combines the hooks above into the game "brain"
├── utils/                          # Plain functions — no React, easy to unit test
│   ├── AnswerPool.ts               # Efficiently picks random real answers as distractors
│   ├── idGenerator.ts              # Hands out simple unique ids
│   ├── resolveHit.ts               # Figures out the new board state after a hit
│   ├── shuffle.ts                  # Fisher-Yates array shuffle
│   ├── spawnAnswer.ts              # Creates + animates one floating answer bubble
│   └── starField.ts                # Generates the background star list
├── colors.ts                       # THEME — every color used in the game
├── constants.ts                    # Fixed sizes, timings, and image assets
├── SpaceBackground.tsx             # Main game screen: layout + rendering only
├── SpaceBlastScreen.tsx            # Route entry point: reads params, loads data
├── index.ts                        # Entry point re-exporting the screen
├── types.ts                        # Shared TypeScript types
└── README.md
```

---

## 3. Component & Screen Flow

### Screen Flow
```
Game Catalog Selection
          ↓
Folder Selection Wizard
          ↓
Game Setup / Asset Preload
          ↓
Shooting Gameplay (Tap bubble → fire bullet → hit → next question)
          ↓
Win Modal or Game Over Modal
          ↓
Automatic Return to Catalog
```

### Key Files
* **`SpaceBackground.tsx`**: Works out layout (ship position, safe zones), calls `useSpaceBlastEngine`, and renders whatever state the engine reports. Has no game rules of its own.
* **`hooks/useSpaceBlastEngine.ts`**: The single place that wires deck progress, floating answers, and bullets together. If you're hunting for "how does scoring work," start here.
* **`components/AnswerBubble.tsx`**: Renders one floating answer and its hit-flash animation.

---

## 4. Data Flow & SQLite Sync

```
[SQLite Flashcards] ──> [useFlashcardSync.ts]
                             │
                             ├─> [SpaceBlastScreen.tsx] (passes cards down)
                             │
                             └─> [SpaceBackground.tsx] → [useSpaceBlastEngine.ts]
                                       │
                                       └─> onAnswer(cardId, correct)
                                                 │
                                                 ├─> [SQLite updateFlashcardStatus] (offline first)
                                                 └─> [PATCH /flashcards/:id] (background sync)
```

1. **Hydration**: `useFlashcardSync` reads `getFlashcardsByFolder(folderId)` from SQLite immediately, so the game can start without waiting on the network.
2. **Background sync**: It then fetches the folder from the server; if anything differs, SQLite and on-screen state are both updated.
3. **Answering**: Every hit calls `onAnswer`, which updates SQLite right away (`updateFlashcardStatus`) and pushes the change to the server via a non-blocking `PATCH`.

---

## 5. Game Hooks & Complex Logic

* **`useDeckProgress.ts`**: Owns "where are we in the deck" — current card (via a shuffled play order), lives, and the win/game-over modal flags. Resets automatically whenever the flashcard list changes.
* **`useFloatingAnswers.ts`**: Owns the board of floating bubbles. Rebuilds the whole board when the question changes, unless the hit-handling code says it already patched the board itself (see `skipNextCardResetRef`).
* **`useBullets.ts`**: Handles firing a bullet, enforcing the fire-rate cooldown/max-bullets limit, and spawning the explosion once a bullet lands.
* **`utils/resolveHit.ts`**: Pure functions that decide what the board should look like right after a hit — kept separate from React state so the tricky "don't always put the next answer in the same slot" logic can be read (and tested) on its own.
* **`utils/AnswerPool.ts`**: Picks distractor answers in O(1) per pick instead of re-shuffling/re-filtering the whole deck every time a bubble is destroyed.

---

## 6. Future Development & AI Context

* **Adding new question types**: Extend `FlashCard` in `types.ts`, then adjust `useFloatingAnswers.ts` and `AnswerPool.ts` if the "answer" concept changes shape.
* **Safe Extension Points**:
  * You can safely add sound effects, new rock color palettes (`ROCK_PALETTES` in `colors.ts`), or new bullet visuals without touching any hook.
  * Difficulty tuning (bubble speed, float amplitude) lives entirely in `constants.ts` and the `speedMultiplier` math in `useDeckProgress.ts`.
* **AI Safety Rules**:
  * Do not remove the `isMountedRef` check inside `useFlashcardSync.ts`; updating state after the component unmounts causes React warnings.
  * Keep floating answers pulled only from real `card.answer` values — never invent distractor text.
  * Don't merge `useDeckProgress`, `useFloatingAnswers`, and `useBullets` back into one big hook/file — the split exists so each one can be understood (and modified) on its own.
