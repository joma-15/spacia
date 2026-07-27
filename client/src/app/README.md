# App Routing (`/client/src/app`)

## 1. Purpose

This folder serves as the central routing system for the Spacia mobile application. It is implemented using **Expo Router**, which provides a file-based routing architecture for React Native. Its primary responsibility is to define the navigation structure of the app, coordinate screen transitions, and bootstrap global contexts and providers.

To keep the codebase clean and modular, files in this directory are intentionally kept **thin**. They act as simple routing entry points (shells) that re-export or reference components defined in the `/features` directory.

---

## 2. Folder Structure

```text
client/src/app/
├── (tabs)/                  # Main bottom-tab-based navigation flows
│   ├── comingsoon.tsx       # Placeholder screen for undeveloped tabs
│   ├── game.tsx             # Game catalog selection screen
│   ├── library.tsx          # User's folder/flashcard library (Home)
│   ├── payment.tsx          # Premium subscription upgrade screen
│   ├── streakcomingsoon.tsx # Placeholder screen for study streaks
│   └── _layout.tsx          # Configures the bottom tab navigator layout
├── games/                   # Game screen shells that load from features
│   ├── FlipSort.tsx         # Route wrapper for the Flip & Sort game
│   ├── MemoryMatch.tsx      # Route wrapper for the Memory Match game
│   ├── SelectionWizard.tsx  # Folder selector wizard shell before a game starts
│   ├── SpaceBlast.tsx       # Route wrapper for the Space Blast game
│   └── WordRush.tsx         # Route wrapper for the Word Rush game
├── CardScreen.tsx           # Route for viewing/editing cards in a folder
├── Commingsoonscreen.tsx    # General fallback for coming soon features
├── GamingScreen.tsx         # Gaming parent layout shell
├── LibraryScreen.tsx        # Library screen entry
├── PaymentScreen.tsx        # Payment screen entry
├── _layout.tsx              # Root app layout (bootstrapping & providers)
├── index.tsx                # Entry point redirect and startup initialization
└── README.md
```

---

## 3. File Responsibilities

* **`index.tsx`**: The main entry point of the app. It initializes the SQLite database, configures the local push notifications service, requests permission for push notifications, and immediately redirects the user to the default screen: the library tab (`/(tabs)/library`).
* **`_layout.tsx` (Root)**: The root layout component. It wraps the entire application with `SafeAreaProvider` for safe boundary offsets and `AddFolderProvider` for managing folder creation state, then returns a flat `Stack` navigator with headers hidden.
* **`(tabs)/_layout.tsx`**: Configures the bottom tab bar. It styles the tabs with the custom theme, renders custom tab bar components (like `BottomNav.tsx`), and sets up routes for the main features of the app (Library, Game, Payment, etc.).
* **`CardScreen.tsx`**: Serves as the route entry for managing cards in a folder. It imports and renders `CardScreen` from `@/features/flashcards/screens/CardScreen`.
* **`games/SelectionWizard.tsx`**: Screen shell that renders the shared folder selection component before starting a game. It allows players to select which study set (folder) they want to play.
* **`games/*.tsx` (FlipSort.tsx, SpaceBlast.tsx, etc.)**: Tiny files that import and re-export the actual game screen components from `@/features/games/...`. This ensures routing is separated from feature logic.

---

## 4. Relationships

* **Providers & Context**: The root layout imports `AddFolderProvider` from `@/shared/context/AddFolderContext`.
* **Database & Services**: `index.tsx` calls `initializeDatabase` from `@/shared/database/database` and notification setup methods (`configureNotifications`, `requestNotificationPermission`) from `@/shared/services/NotificationService`.
* **Features Import**: This folder imports screens directly from their feature modules in `client/src/features/...` (e.g., `@/features/flashcards/screens/CardScreen` and `@/features/games/...`).
* **Navigation Flow**:
  1. App starts -> `index.tsx` -> calls database/notification setup -> redirects to `/(tabs)/library`.
  2. Tabs navigation is handled by Expo Router's tab layout using custom navigation buttons.
  3. Game tab (`/(tabs)/game`) navigates to `games/SelectionWizard.tsx` passing target game parameters -> wizard navigates to selected game route (e.g. `games/SpaceBlast.tsx` or `games/FlipSort.tsx`).

---

## 5. Best Practices

* **Keep Routes Thin**: Never write business logic, styling, state management, or UI rendering directly in these files. All of that belongs in `@/features/<feature-name>`. Route files should only import and re-export screen components, or set up navigator configurations.
* **Use Relative Imports Carefully**: Ensure imports to `@/features/...` and `@/shared/...` use paths defined in `tsconfig.json` paths mapping (e.g., using the `@/` prefix).
* **Navigation Stack Integrity**: Use `router.replace` instead of `router.push` when navigating away from games or onboarding screens to avoid bloating the navigation history stack.

---

## 6. AI Guidance

* **Purpose**: This folder exists solely to manage Expo Router file-based paths and layouts.
* **Safe Areas to Modify**: You can safely modify tab icon styles or change navigator parameters inside `_layout.tsx` and `(tabs)/_layout.tsx`.
* **Do NOT Modify**:
  * Avoid adding inline screens or feature logic. Keep code re-exports as simple one-liners where possible.
  * Do not bypass the database initialization in `index.tsx`.
