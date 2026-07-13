# Spacia developer guide

This guide explains where a change belongs before you start editing.  Read the
relevant section first; it is safer than making the same change in several
screens or routes.

## The request and data flow

```
Expo screen/component
  -> feature hook (state, loading, API calls)
  -> Flask route (HTTP validation and response)
  -> service (business rules and database commit)
  -> SQLAlchemy model / MySQL

The client also mirrors folders and flashcards in SQLite.  The server remains
the source of truth whenever it is reachable; SQLite is an offline fallback.
```

## Frontend map

- `client/src/app`: Expo Router entry points only.  Keep these files thin.
- `client/src/features/<name>/screens`: combines a hook and presentational
  components for one screen.
- `client/src/features/<name>/hooks`: asynchronous work, state transitions,
  and event handlers.  New API behaviour normally belongs here.
- `client/src/features/<name>/components`: reusable visual pieces.  They
  receive props and should not know database or API details.
- `client/src/shared/database`: SQLite schema and small repositories.  Do not
  run SQL directly inside a component.
- `client/src/shared/config/api.ts`: the single backend base URL.

### Flashcard loading

`useFlashCards` is the central flashcard hook.  Opening a folder starts a
server refresh.  If that request fails, it reads SQLite instead.  A successful
server response replaces the folder's SQLite rows rather than only inserting
new rows; this prevents deleted cards from returning as stale cache data.

AI generation is synchronous today: the selected textbook is sent as
`multipart/form-data` to `POST /flashcards/:folderId`, then the hook refreshes
the saved cards endpoint.  Keep the file field name as `file` unless the
backend route is changed too.

### Safe React rules

1. Check `response.ok` before treating an API response as valid data.
2. Do not update state after an effect unmounts.  Hooks use an `isMounted` ref
   or a local boolean for this reason.
3. Keep derived values (filtered lists and counts) computed from state instead
   of duplicating them in more state variables.
4. Use a loading state around visible asynchronous work; always clear it in
   `finally`.

## Backend map

- `server/app.py`: app factory, extensions, route registration, global errors.
- `server/routes`: request parsing, required-field checks, HTTP status codes.
- `server/services`: use cases and commits.  Put validation that protects data
  here, not only in the client.
- `server/models`: database columns and `to_dict()` response serialization.
- `server/validation.py` and `server/errors.py`: shared API error behaviour.

### Adding an API feature

1. Add or change a service method.
2. Add a route method that validates the request then calls that service.
3. Return JSON in the existing response style.
4. Add a focused test in `server/tests`.
5. Update the feature hook, then keep the screen/component focused on UI.

### Textbook uploads

The AI route accepts `.pdf` and `.docx` only, saves the upload with a UUID,
extracts text, calls Groq, saves generated cards, and deletes the temporary
file in a `finally` block.  Never retain a user upload accidentally, and never
use the original filename as a filesystem path.  The configured 20 MB limit
is `MAX_CONTENT_LENGTH` in `server/config.py`.

## Before submitting a change

- Run `npx.cmd tsc --noEmit` from `client`.
- Run `python -m unittest discover -s tests` from `server` using its virtual
  environment when the change touches backend code.
- Test both the successful path and one error path (missing data, a bad file,
  or a missing record).
- Keep secrets in `server/.env`; only placeholders belong in `.env.example`.
