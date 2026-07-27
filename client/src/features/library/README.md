# Library Feature (`/client/src/features/library`)

## 1. Purpose

The Library module functions as the default home screen dashboard for Spacia. It aggregates and displays all subject study folders (e.g., Biology, Organic Chemistry, World History) along with their respective flashcard counts. It provides:
* Interactive lists and grids of study folders.
* Folder search capabilities and quick statistics.
* Simple CRUD folder management (creating, renaming, deleting folders).
* Automatic folder data and card count synchronization via a combination of local SQLite caching and remote Flask API integration.

---

## 2. Folder Structure

```text
client/src/features/library/
├── components/                 # UI components used to construct the Library screen
│   ├── AddFolderModal.tsx      # Modal overlay with inputs to configure a new folder
│   ├── BottomNav.tsx           # Feature-specific bottom navigation bar
│   ├── EmptyState.tsx          # Displayed when no folders match the query or catalog is empty
│   ├── FolderCard.tsx          # Renders a folder tile (subject, card count, options dropdown)
│   ├── FolderGrid.tsx          # Renders a grid container for FolderCards
│   ├── FolderSkeleton.tsx      # Skeleton loaders shown during database/server fetches
│   ├── GreetingSection.tsx     # Welcome banner featuring username and search text box
│   ├── LoadingModal.tsx        # Spinner blocker overlay shown during blocking transactions
│   ├── PopupNavBanner.tsx      # Banner explaining notification features
│   └── SectionHeader.tsx       # Sub-heading for folder list featuring count and delete all options
├── hooks/                      # Custom hooks driving business logic
│   ├── useFolderFlashcards.ts  # Fetches card lists and details for a selected folder
│   ├── useFolders.ts           # Fetches and mutates the list of available folders
│   └── useLibrary.ts           # Orchestrates folders CRUD, search queries, and sync queues
├── theme.ts                    # Styling configuration theme variables
├── types.ts                    # TypeScript types (Folder structure)
├── constants.ts                # Constants and action limits
└── README.md
```

---

## 3. File Responsibilities

* **`screens/LibraryScreen.tsx`**: Assembles the entire homepage layout. It binds states from the `useLibrary` hook to render welcoming cards, folder grids, search fields, loading skeletons, or empty placeholders.
* **`hooks/useLibrary.ts`**:
  * Acts as the state controller for the library dashboard.
  * Synchronously retrieves folder metadata from SQLite (`folderRepository`) and maps counts using `getCardCountsPerFolder()`.
  * Runs background sync requests (`syncPendingFolders`) to match offline creations/deletes with the server.
  * Listens to screen focus hooks (`useFocusEffect`) to reload counts whenever returning from other pages.
* **`components/FolderCard.tsx`**: Presentational element for a folder. It styles folders with user-selected accent colors, shows card count badges, and handles actions (e.g. rename input popup, confirmation delete popup).
* **`theme.ts`**: Implements custom Spacia colors, card borders, heights, padding tokens, and font typography constants.

---

## 4. Relationships

* **Routes**: Loaded as the primary root index tab by `client/src/app/(tabs)/library.tsx`.
* **Database**: Interfaces with `client/src/shared/database/folderRepository.ts` for database CRUD operations and `flashcardRepository.ts` to retrieve local card counts.
* **API Endpoints Called**:
  * `GET /folders` -> fetches synced folder lists.
  * `POST /folders` -> registers new folder.
  * `DELETE /folders/:id` -> removes folder from backend database.

---

## 5. Best Practices

* **Instant Focus Reloads**: Flashcard count changes occur outside the library screen (inside the individual folder/game views). To ensure the library counts are kept up-to-date, always trigger local database reads inside a `useFocusEffect` callback, which fires every time a user returns to the screen.
* **Avoid Nested Calculations**: Perform search filtering (`filteredFolders`) dynamically during rendering rather than saving it to separate React states. This prevents states from falling out of sync with the master list.

---

## 6. AI Guidance

* **Purpose**: Manages folder catalog presentation, folder search queries, and folder synchronization.
* **Safe Areas to Modify**: 
  * Layout grid calculations (adjusting columns for tablets), search placeholder strings, cards animation styles, greeting headers, and folder accent color arrays.
* **Do NOT Modify**:
  * Do not bypass the `useFocusEffect` reload block; otherwise, card count badges will show stale values when users return from creating cards or playing games.
  * Ensure folder deletions update local SQLite repositories (`deleteFolderCache`) immediately to prevent dead rows.
