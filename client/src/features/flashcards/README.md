# Flashcards Feature (`/client/src/features/flashcards`)

## 1. Purpose

The Flashcards module is the core learning content manager for Spacia. It handles creating, viewing, updating, and deleting study flashcards within a specific subject folder. It supports:
* Traditional manual card editing (creating questions and answers).
* AI-driven card generation by uploading textbooks (PDF/Word documents).
* Offline-first operations, performing instant UI and SQLite cache updates and queuing background synchronization calls to the backend API.

---

## 2. Folder Structure

```text
client/src/features/flashcards/
├── components/                 # Sub-components used to build the cards screen
│   ├── AddCardModal.tsx        # Overlay for manually creating new cards
│   ├── CardItem.tsx            # Renders a single card (supports swipe, flip, and edit)
│   ├── CardList.tsx            # Renders a scrollable list of card items
│   ├── CardSkeleton.tsx        # Skeleton layout for loading states
│   ├── DeleteAllModal.tsx      # Confirmation dialog for clearing a folder
│   ├── Header.tsx              # Feature header showing subject name and actions
│   ├── InitialLoadingModal.tsx # Fullscreen loading spinner shown on initial mount
│   ├── LoadingModal.tsx        # Spinner overlay shown during async background operations
│   ├── PremiumModal.tsx        # Upsell modal triggered when card limit is reached
│   ├── StatsCard.tsx           # Progress bar and stats summary for understood cards
│   ├── TabRow.tsx              # Filter tabs (All, Review, Understood)
│   └── TextbookUploadModal.tsx # Document upload modal for AI generation
├── hooks/
│   └── useFlashCards.ts        # Central business hook (sync, loading, AI upload, mutations)
├── screens/
│   └── CardScreen.tsx          # Screen composer assembling components and binding state
├── styles/
│   └── styles.ts               # Shared visual styling rules for the flashcard module
├── constants.ts                # Action limits, timeouts, and design parameters
├── types.ts                    # TypeScript types (FlashCard, CardStatus, TabType)
└── README.md
```

---

## 3. File Responsibilities

* **`screens/CardScreen.tsx`**: Compiles all presentational sub-components. It loads the `useFlashCards` hook with the active `folderId` route param, matches UI states to modals, and handles layouts.
* **`hooks/useFlashCards.ts`**: The brain of the flashcard feature.
  * Manages states for `cards`, active filtering `activeTab`, and `loading`/`initialLoading` flags.
  * Eagerly mutates local SQLite cache database (`flashcardRepository`) for responsive offline UX.
  * Resolves synchronization queue via `syncPendingFlashcards` to resolve offline mutations.
  * Uses `expo-file-system` to upload documents to `POST /flashcards/:folderId` as a multipart form data file upload, launching Groq AI generation.
* **`components/CardItem.tsx`**: Renders individual question/answer blocks. Supports flipping to see the answer, launching inline editing fields, and swiping to trigger deletions.
* **`components/TextbookUploadModal.tsx`**: Interfaces with the native mobile file picker (`expo-document-picker`) to select PDF or DOCX textbooks and coordinates uploads.
* **`types.ts`**: Declares types:
  * `FlashCard` (id, question, answer, status).
  * `CardStatus` ('review' | 'understood').
  * `TabType` ('all' | 'review' | 'understood').

---

## 4. Relationships

* **Routes**: Loaded by [client/src/app/CardScreen.tsx](file:///d:/spacia/client/src/app/CardScreen.tsx) matching the url query route `/CardScreen?folderId=XYZ&folderName=Biology`.
* **Database**: Imports queries from `client/src/shared/database/flashcardRepository.ts` to perform SQLite operations offline.
* **API Endpoints Called**:
  * `GET /flashcards/:folderId/saved` -> fetches synced cards.
  * `POST /flashcards/:folderId/manualSaved` -> pushes manually created card.
  * `PATCH /flashcards/:cardId` -> updates study status.
  * `DELETE /flashcards/:cardId` -> deletes card.
  * `DELETE /flashcards/folder/:folderId` -> clears folder.
  * `POST /flashcards/:folderId` -> uploads textbook attachment for AI extraction.

---

## 5. Best Practices

* **Optimistic UI Updates**: When updating card status or deleting cards, always update the React state (`setCards`) and SQLite cache immediately before launching background API fetches. This makes the interface feel snappy.
* **Timeout Guards**: Always include fetch timeouts (e.g. `FETCH_TIMEOUT_MS = 8000`) and use `AbortController` signals to cancel hanging network queries when a user exits the screen before response arrival.
* **Use InteractionManager**: Delay heavy network sync operations until screen transition transitions complete to prevent animation frame drops (e.g. using `InteractionManager.runAfterInteractions`).

---

## 6. AI Guidance

* **Purpose**: Manages study card CRUD, offline syncing queues, and document uploads for AI generation.
* **Safe Areas to Modify**: 
  * Modal dialog components, animation curves, text labels, styling constants in `styles.ts`, and filter tab selections.
* **Do NOT Modify**:
  * Keep the backend file upload parameter named `file` inside `fetchAiCards` (Expo FileSystem upload) unless the backend route receives changes too.
  * Do not bypass SQLite updates when making mutations. Local database records must match UI state.
