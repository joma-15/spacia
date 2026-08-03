# Streak Dashboard (`/client/src/features/dashboard/StreakDashboard`)

> Adjust the path above if you place this feature folder somewhere else —
> update the import in `app/streak-dashboard.tsx` to match.

## 1. Overview

**Streak Dashboard** is the home screen of the Spacia app: a dark, green-accented
overview of the user's study habits.

* **Purpose**: Surface today's progress (goal, XP, streak) and pull the user
  back into studying via folders, achievements, and a daily challenge.
* **Gameplay Summary**: Not a game screen — it's a pull-to-refresh dashboard.
  Each section (goal, stats, calendar, achievements, folders, challenge, quote)
  loads independently and shows a skeleton while its own request is pending.

---

## 2. Folder Structure

```text
client/src/features/dashboard/StreakDashboard/
├── components/                 # Presentational building blocks
│   ├── AchievementCard.tsx
│   ├── CalendarCard.tsx
│   ├── ChallengeCard.tsx
│   ├── DailyGoalCard.tsx
│   ├── FolderCard.tsx
│   ├── Header.tsx
│   ├── ProgressBar.tsx
│   ├── QuoteCard.tsx
│   ├── SectionHeader.tsx
│   ├── SkeletonCard.tsx
│   ├── StatisticsCard.tsx
│   └── StreakBadge.tsx
├── hooks/                       # One data-loading hook per resource
│   ├── useAchievements.ts
│   ├── useCalendar.ts
│   ├── useDailyChallenge.ts
│   ├── useDailyGoal.ts
│   ├── useFolders.ts
│   ├── useQuote.ts
│   ├── useStatistics.ts
│   └── useStreak.ts
├── services/                    # Mock "API client" layer (mirrors future Flask routes)
│   ├── AchievementService.ts
│   ├── CalendarService.ts
│   ├── ChallengeService.ts
│   ├── FolderService.ts
│   ├── StatisticsService.ts
│   └── StreakService.ts
├── data/                        # Mock data shaped like backend responses
│   ├── achievements.ts
│   ├── calendar.ts
│   ├── dailyChallenge.ts
│   ├── folders.ts
│   ├── statistics.ts
│   └── streakData.ts
├── utils/                       # Pure business-logic helpers
│   ├── calculations.ts          # Derived percentages, remaining counts, messages
│   ├── date.ts                  # ISO date / relative-day / calendar helpers
│   └── xp.ts                    # XP rules and formatting
├── constants/
│   ├── quotes.ts                # Motivational quote pool + random picker
│   └── theme.ts                 # Colors, spacing, radii, typography, shadow
├── types.ts                     # Shared type contracts for the whole feature
├── StreakDashboardScreen.tsx    # Screen composer — wires hooks to components
├── index.ts                     # Entry point re-exporting StreakDashboardScreen
└── README.md
```

The router entry lives outside the feature folder, following Expo Router
convention:

```text
client/src/app/streak-dashboard.tsx   # thin wrapper importing StreakDashboardScreen
```

---

## 3. Component & Screen Flow

### Screen Flow
```
App Launch / Tab Navigation
          ↓
StreakDashboardScreen mounts
          ↓
Each hook (useStreak, useDailyGoal, useStatistics, useCalendar,
useAchievements, useFolders, useDailyChallenge) fires its own load
          ↓
Sections render skeletons until their own data resolves
          ↓
Pull-to-refresh re-triggers every hook's refresh() in parallel + rotates quote
```

### Section Documentation
* **`Header` + `StreakBadge`**: Greeting and current streak count.
* **`DailyGoalCard`**: Today's review target, percent complete, and a message
  that reacts to actual progress (`utils/calculations.ts` → `dailyGoalMessage`).
* **`StatisticsCard`** (×4): Cards reviewed, games played, study time, XP earned.
* **`CalendarCard`**: Month grid colored by day status (`completed`, `missed`,
  `today`, `future`).
* **`AchievementCard`**: Horizontally scrollable; locked vs. unlocked styling.
* **`FolderCard`**: Grid of study folders with mastery % derived from
  `computeFolderProgress`.
* **`ChallengeCard`**: Daily challenge with a `startChallenge()` mutation that
  nudges progress forward (mock optimistic update).
* **`QuoteCard`**: Rotates via `useQuote()` on mount and on refresh.

---

## 4. Data Flow

```
[Mock Data: data/*.ts] ──> [Services: services/*.ts]  (simulated network delay)
                                    │
                                    └─> [Hooks: hooks/use*.ts]  (AsyncResource<T> pattern)
                                              │
                                              └─> [StreakDashboardScreen.tsx] ──> [components/*]
```

1. **Mock data** in `data/` mirrors the shape a Flask endpoint would return
   (e.g. `GET /api/folders`, `GET /api/streak`).
2. **Services** in `services/` simulate network latency with a local `delay()`
   helper and return copies of the mock data. Swap the body of each method for
   a real `fetch()` call later — hooks and components never need to change.
3. **Hooks** in `hooks/` all implement the same `AsyncResource<T>` shape
   (`data`, `loading`, `refreshing`, `error`, `refresh()`), so every section of
   the screen loads and refreshes independently.
4. **`StreakDashboardScreen.tsx`** composes every hook, renders skeletons while
   loading, and wires `RefreshControl` to call every hook's `refresh()` in
   parallel.

---

## 5. Derived Values — Never Hardcoded

All percentages and remaining counts are computed, never stored:
* `computeFolderProgress(folder)` → mastery %, completion %, remaining cards.
* `computeDailyGoalProgress(goal)` → percent, remaining, `isComplete`.
* `achievementProgressPercent(progress, target)` → clamped percent.

This keeps a single source of truth: if a card count changes, every dependent
UI value recalculates automatically.

---

## 6. Future Development & AI Context

* **Wiring to the real backend**: Replace each `services/*.ts` method body
  with a `fetch()`/JWT-authenticated call matching the documented endpoint in
  its docblock (e.g. `GET /api/streak`). No changes needed in `hooks/` or
  `components/`.
* **Safe Extension Points**: Add new stat cards to the `statsGrid` in
  `StreakDashboardScreen.tsx`, or new achievements/folders to the mock data —
  everything downstream (progress bars, labels) derives automatically.
* **AI Safety Rules**:
  * Keep all derived values (`masteryPercent`, `percent`, progress bars) computed
    via `utils/calculations.ts` — do not hardcode a percentage in a component.
  * Preserve the `AsyncResource<T>` hook shape (`data/loading/refreshing/error/refresh`)
    across all `hooks/use*.ts` files for consistency.
  * `ChallengeService.startChallenge` mutates in-memory module state
    (`challengeState`) to simulate a session — don't remove this without
    replacing it with a real mutation call.
