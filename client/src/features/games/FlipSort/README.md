# Flip & Sort Game (`/client/src/features/games/FlipSort`)

## 1. Overview

**Flip & Sort** is a 3D flashcard studying game styled after Quizlet. 
* **Purpose**: Reinforce vocabulary, definitions, and concepts through active recall.
* **Learning Objective**: Go through a selected study deck, marking cards as "Understood" (correct) or "Review" (incorrect) until all cards are successfully memorized.
* **Gameplay Summary**: The player is presented with a stack of cards. Tapping a card triggers a 3D flip animation revealing the answer. Swiping or tapping the buttons moves the card to the "Understood" pile (greens) or the "Review" pile (reds). The game displays progress bars and pill counters showing the session status.

---

## 2. Folder Structure

```text
client/src/features/games/FlipSort/
├── components/                 # Sub-components forming the game screen layout
│   ├── ActionButtons.tsx       # Bottom buttons for Review (Red), Understood (Green), Back, Skip
│   ├── EmptyDeckState.tsx      # Renders when there are no cards in the folder
│   ├── FlipCard.tsx            # The interactive 3D card (front and back layouts + animations)
│   ├── FlipSortHeader.tsx      # Header displaying subject folder name and progress count
│   └── ProgressBar.tsx         # Progress bar indicating completed card percentage
├── hooks/                      # Game session and animation custom hooks
│   ├── useCardFlip.ts          # Handles visual 3D rotation animations and state toggling
│   └── useFlipSortSession.ts   # Manages active card indexes, counts, and completion triggers
├── colors.ts                   # Hex color codes for buttons and pills
├── FlipSortScreen.tsx          # Screen composer that loads and initializes the session
├── index.ts                    # Entry point re-exporting the FlipSortScreen
├── types.ts                    # Game type structures
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
Game Setup / Asset Check
          ↓
Card Gameplay (Tap to Flip, Swipe/Tap to Sort)
          ↓
Completion Alert (Understood vs Review stats)
          ↓
Automatic Return to Catalog
```

### Component Documentation
* **`FlipCard.tsx`**: Renders front and back card layouts. Uses absolute positioning and a `backfaceVisibility: 'hidden'` style. Applies the custom 3D rotation interpolation curves from `useCardFlip`.
* **`ActionButtons.tsx`**: Controls active triggers (Review, Understood, Skip, Back). Styled using green and red highlights.
* **`ProgressBar.tsx`**: A horizontal bar interpolating width based on progress percentages (completed cards / total deck size).

---

## 4. Data Flow & SQLite Sync

```
[SQLite Flashcards] ──> [FlipSortScreen.tsx]
                             │
                             ├─> [useFlipSortSession.ts] (Active Index)
                             │
                             └─> [onUpdateCardStatus] (Mutates Status)
                                       │
                                       ├─> [SQLite updateFlashcardStatus] (Offline first)
                                       └─> [PATCH /flashcards/:id] (Background sync)
```

1. **Hydration**: `FlipSortScreen` queries SQLite using `getFlashcardsByFolder(folderId)` on mount, filtering only cards whose status is `'review'` (cards that still need studying).
2. **Action Tap/Swipe**: When sorting a card, the handler invokes `onUpdateCardStatus`.
3. **Database Write**: Local SQLite status is modified to `'understood'` or `'review'` via `updateFlashcardStatus(cardId, newStatus)`.
4. **Server Push**: A non-blocking background fetch runs `PATCH ${BASE_URL}/flashcards/${cardId}` to synchronize changes on the Flask database.

---

## 5. Game Hooks & Complex Logic

### Custom Hooks
* **`useCardFlip.ts`**: Builds interpolation bounds using React Native's `Animated` engine. 
  * Front card rotates from `0deg` to `180deg`.
  * Back card rotates from `180deg` to `360deg`.
  * Animates value from `0` to `1` over `300ms` with spring ease.
* **`useFlipSortSession.ts`**: Coordinates the study sequence. 
  * Derived state calculations: `reviewCount`, `understoodCount`, `progressPercent`.
  * Functional update calls in `setIndex` protect against double-taps triggering array index overflow errors.

### 3D Flip Interpolation Logic
To prevent the back card text from looking reversed or flipped upside down, the front and back layouts are rotated concurrently:
```typescript
const frontInterpolate = animatedValue.interpolate({
  inputRange: [0, 1],
  outputRange: ["0deg", "180deg"],
});
const backInterpolate = animatedValue.interpolate({
  inputRange: [0, 1],
  outputRange: ["180deg", "360deg"],
});
```

---

## 6. Future Development & AI Context

* **Adding Swiping Gestures**: To add pan gestures (dragging cards left/right), integrate `PanResponder` or `react-native-gesture-handler` directly inside `FlipCard.tsx` and bind outputs to `markAsUnderstood()` or `markForReview()`.
* **Safe Extension Points**: 
  * You can safely expand card styling, add audio feedback clips, or add a swipe multiplier.
* **AI Safety Rules**:
  * Do not change the `isMountedRef` check inside hooks; updating state after component unmounts causes React warnings.
  * Keep the card filter checking for `status === 'review'` on load to ensure only unlearned cards appear, unless the user requests a "study all cards" mode.
