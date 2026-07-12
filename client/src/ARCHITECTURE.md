# Frontend architecture

This frontend uses a feature-first structure so that a new feature can usually be understood and changed in one place.

```
src/
  app/                 Expo Router routes only
  features/            Feature-owned screens, components, hooks, types, and constants
    library/
    flashcards/
    flashcard-study/
    games/
    payment/
    coming-soon/
    schedules/
  shared/              Code used by more than one feature
    components/        Reusable UI, such as navigation
    config/            App configuration
    context/           App-wide React context
    database/          SQLite setup and repositories
    services/          Device and integration services
```

## Contribution guide

- Add route files only in `src/app`. Keep them thin: import and render a feature screen.
- Put new product work in `src/features/<feature-name>`.
- Move code to `src/shared` only after it is genuinely used by multiple features.
- Prefer imports through `@/` for cross-feature or shared code. Keep relative imports inside one feature.
- Keep screen orchestration in `screens/`, reusable visual pieces in `components/`, and stateful behavior in `hooks/`.
