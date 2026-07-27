# Shared Components (`/client/src/shared/components`)

## 1. Purpose

This folder contains reusable visual UI components shared across multiple feature modules in the Spacia mobile application. These components are strictly presentational (dumb components), meaning they receive data and callbacks via React props and remain decoupled from database queries, direct API calls, or global business state.

By placing shared layout elements and UI primitives here, we ensure a unified design language, reduce code duplication, and maintain a consistent look-and-feel across library screens, game interfaces, and payment sheets.

---

## 2. Folder Structure

```text
client/src/shared/components/
├── games/                   # Reusable components specific to game setup and orchestration
│   ├── hooks/
│   │   └── useSelectionWizard.ts # Fetches folders & card counts from local DB / API
│   └── SelectionWizard.tsx  # Folder selector list view interface
├── navigation/              # Navigation elements shared globally
│   └── BottomNav.tsx        # Custom tab bar with active selection highlights
├── Skeleton.tsx             # Generic animated loading skeleton indicator
└── README.md
```

---

## 3. File Responsibilities

* **`Skeleton.tsx`**: A reusable UI indicator that renders fading gray blocks using React Native's `Animated` library (interpolating opacity from `0.3` to `0.7` in loop). Used for layout skeleton hydration states in lists (e.g. while folders or cards are downloading).
* **`navigation/BottomNav.tsx`**: Renders the application's bottom tab bar. It manages the active navigation state (Library, Game, Streak, Payment), applies the custom dark green glassmorphic design theme, and coordinates redirects when buttons are pressed.
* **`games/SelectionWizard.tsx`**: A shared wizard overlay/screen that displays a list of study folders with their card counts. It is used prior to launching a game to let the user select which deck they want to study.

---

## 4. Relationships

* **Imported By**: 
  * `client/src/app/(tabs)/_layout.tsx` imports and uses `BottomNav` to replace the default Expo Router tab bar.
  * Screen shells under `client/src/app/games/` import `SelectionWizard` to orchestrate folder selection.
  * Feature screens like `LibraryScreen.tsx` and `CardScreen.tsx` import `Skeleton.tsx` for visual skeleton states during initial loads.
* **Internal Hooks**:
  * `SelectionWizard.tsx` depends on the custom hook `useSelectionWizard` located in `games/hooks/useSelectionWizard.ts` to retrieve and cache the list of study folders.

---

## 5. Best Practices

* **No Side-Effects**: Shared components must not invoke `fetch` directly or run database operations. They should trigger action callbacks passed down from parents (e.g. `onPress`, `onSelect`).
* **Design Token Compliance**: Use color definitions from the theme palette (`colors.ts`) instead of hardcoded hex values to support dark mode consistently.
* **Performance (Memoization)**: Since components in this folder are shared and frequently rerendered, utilize `React.memo` (like `FolderItem` in `SelectionWizard`) to prevent unnecessary redraws when parent state updates.

---

## 6. AI Guidance

* **Purpose**: Presentational components and navigation layout layers shared across features.
* **Safe Areas to Modify**: 
  * Visual styles, padding, margin, active state colors, and micro-animations inside `Skeleton.tsx` and `BottomNav.tsx`.
  * Layout structure of `SelectionWizard.tsx` cards.
* **Do NOT Modify**:
  * Do not introduce direct database/network dependencies inside these files.
  * Keep the prop contracts stable as they are imported across multiple routing endpoints.
