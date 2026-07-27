# Game Catalog Feature (`/client/src/features/games/GameCatalog`)

## 1. Purpose

The Game Catalog module provides the primary navigation catalog screen for Spacia's study games dashboard. It acts as the game launcher panel where users can search, browse, view streaks, and launch different interactive game modules.

---

## 2. Folder Structure

```text
client/src/features/games/GameCatalog/
├── components/                 # Presentation components for the catalog screen
│   ├── EmptyState.tsx          # Displayed when search matches no games
│   ├── GameCard.tsx            # Visual card representing a single game option
│   ├── ScreenHeader.tsx        # Top header displaying greeting and streak counts
│   ├── SearchBar.tsx           # Search input box with clear controls
│   ├── SectionHeader.tsx       # Text sub-headers
│   ├── StreakPill.tsx          # Interactive pill showing consecutive study streaks
│   └── index.ts                # Component re-export file
├── constants/
│   ├── colors.ts               # Color theme definitions
│   └── gameCategories.ts       # Declares metadata lists of registered games
├── hooks/
│   └── useGameSearch.ts        # Search string filtering state controller
├── types/
│   └── index.ts                # TypeScript interfaces (GameCategory, GameTheme)
├── GameCatalog.tsx             # Assembly component combining layout pieces
├── index.ts                    # Module export file
└── README.md
```

---

## 3. File Responsibilities

* **`GameCatalog.tsx`**: Composer file that pulls in `useGameSearch` hook, passes `GAME_CATEGORIES` data, and constructs a list of `GameCard` selectors. Emits `onSelectGame` callbacks to the parent shell navigator.
* **`hooks/useGameSearch.ts`**: Provides the search filtering logic. Uses `useMemo` to filter game categories on-the-fly based on search text updates, preventing state mismatches.
* **`constants/gameCategories.ts`**: The registry for game configurations. Declares titles, visual image resources (e.g., `flip-sort.png`, `spaceblast.png`), background accent colors, and path destinations:
  * **Flip & Sort**: `/games/FlipSort`
  * **Space blast**: `/games/SpaceBlast`

---

## 4. Relationships

* **Parent Screen**: Mounted and styled by `client/src/features/games/screens/GamingScreen.tsx`.
* **Routing Integration**: When a catalog card is selected, it triggers `onSelectGame(category)`, redirecting the app to the folders wizard `/games/SelectionWizard` before forwarding to the target game route.

---

## 5. Best Practices

* **State Separation**: Keep filtering and search queries out of the main database logic. Use clean memory memos (`useMemo`) inside hooks to compute filtered views dynamically from master lists.
* **Asset Loading Security**: Thumbnails must be loaded using absolute path queries or `require()` statements inside categories configurations rather than resolved dynamically on runtime, protecting against image load crashes.

---

## 6. AI Guidance

* **Purpose**: Manages game discovery lists and catalog presentation.
* **Safe Areas to Modify**: 
  * Spacing inside `GameCard.tsx`, search bar icons, styling details, card border radius, and active streak badge layouts.
* **Do NOT Modify**:
  * Do not bypass the `useGameSearch` filtering mechanism when displaying card lists.
  * Ensure path strings configured inside `gameCategories.ts` match exactly with routes defined under `client/src/app/games/`.
