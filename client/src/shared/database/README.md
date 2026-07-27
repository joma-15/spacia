# Client Database Layer (`/client/src/shared/database`)

## 1. Purpose

This folder manages the local SQLite database running on the user's mobile device. It acts as the local offline-cache and sync coordinator for Spacia. By caching study folders, flashcards, and reminder schedules on-device, the app ensures instant startup speeds, seamless offline functionality, and resilient performance under poor network conditions.

The server remains the global source of truth; when online, the app synchronizes changes back and forth. When offline, all changes are written locally and flagged for synchronization once connectivity is restored.

---

## 2. Folder Structure

```text
client/src/shared/database/
├── database.ts               # Database initialization, schema setup, migrations, & UUID generation
├── flashcardRepository.ts    # CRUD and sync operations for flashcards
├── folderRepository.ts       # CRUD and sync operations for subject folders
├── notificationRepository.ts # Database mapping for active system notification states
├── scheduleRepository.ts     # CRUD and sync operations for reminder schedules
└── README.md
```

---

## 3. File Responsibilities

* **`database.ts`**: 
  * Opens/creates the local `spacia.db` file using `expo-sqlite` (`openDatabaseSync`).
  * Runs table creation scripts on app boot (`initializeDatabase()`).
  * Defines schema columns for `folders`, `flashcards`, and `schedules`.
  * Runs migration scripts (e.g. adding `sync_status` columns to old tables).
  * Provides a standalone client-side UUID generator (`uuidv4()`).
* **`folderRepository.ts`**:
  * Coordinates CRUD operations for subject folders.
  * Filters out folders marked as `pending_delete` from local list queries.
  * Implements write strategies: folders created offline are flagged as `pending_create`, while deleted folders are flagged as `pending_delete` rather than immediately deleted from the database (unless they were only created offline).
* **`flashcardRepository.ts`**:
  * Manages SQL operations for questions and answers.
  * Replaces folders' cards bulk-write to avoid stale cache rows.
  * Retrieves card counts per folder (`getCardCountsPerFolder`) to drive dashboard metrics efficiently.
* **`scheduleRepository.ts`**:
  * Stores and updates study reminder schedules and active intervals.
* **`notificationRepository.ts`**:
  * Connects system-registered notification IDs to study schedules to enable notification cancellations and rescheduling.

---

## 4. Relationships

* **Consumer Feature Hooks**:
  * `client/src/features/flashcards/hooks/useFlashCards.ts` calls `getFlashcardsByFolder`, `saveFlashcards`, `deleteFlashcard`, and `updateFlashcardStatus`.
  * `client/src/features/library/hooks/useFolders.ts` calls `getFolders` and folder mutation repositories.
* **Shared Component Hooks**:
  * `client/src/shared/components/games/hooks/useSelectionWizard.ts` calls `getFolders` and `getCardCountsPerFolder` to render setup screens.
* **Database Connection Flow**:
  1. App bootstraps -> `client/src/app/index.tsx` calls `initializeDatabase()`.
  2. Database tables are verified/migrated synchronously before the UI is rendered.
  3. Feature hooks query repository functions (e.g., `getFolders()`).
  4. Repository functions execute sync queries against the open `db` instance from `database.ts`.

---

## 5. Best Practices

* **Do Not Run SQL inside Components**: All SQL queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) must be isolated within repository files. Components and hooks should interact with these records using TypeScript helper functions.
* **Offline-First Status Tracking**: Every table record has a `sync_status` column. When performing a mutation while the server might be offline, set this column to `pending_create`, `pending_update`, or `pending_delete` to allow background sync tasks to retry calls.
* **Indices for Performance**: Always ensure foreign keys used in frequent joins or lookups (such as `folder_id` in the `flashcards` table) have matching database indexes (like `idx_flashcards_folder`) to prevent expensive full-table scans.
* **Client-Side ID Generation**: Use the `uuidv4()` utility from `database.ts` to assign primary keys to new folders or cards immediately. Do not wait for server-side responses to assign IDs, as this breaks offline editing capabilities.

---

## 6. AI Guidance

* **Purpose**: Local SQLite database cache configurations and SQL query repository files.
* **Safe Areas to Modify**: 
  * You can safely add new repository query functions or filter states (such as sorting folders by date or filter parameters).
* **Do NOT Modify**:
  * Do not alter the SQLite schema inside `database.ts` without writing a corresponding fallback `ALTER TABLE` try-catch block to run migration routines on existing databases.
  * Do not bypass the `sync_status` lifecycle. Local updates must set sync status flags correctly.
