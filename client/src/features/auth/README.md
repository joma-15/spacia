# streak-auth

Replaces the "Coming Soon" screen in the Streak tab with a full auth flow
(landing screen → modal with Login / Create Account / Forgot Password →
persisted session), styled to match the app's existing dark-green design
system. Structured to match the `flashcards` feature module.

## Folder Structure

```text
client/src/features/streak-auth/
├── components/
│   ├── AuthModal.tsx            # Animated bottom-sheet modal, mode switching
│   ├── AuthInput.tsx            # Reusable input incl. show/hide password
│   ├── AuthButton.tsx           # Reusable button with loading/disabled states
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ForgotPasswordForm.tsx
├── hooks/
│   ├── useAuth.tsx              # Central business hook: AuthProvider + useAuth
│   │                             #   (state, session persistence, mutations)
│   └── authApi.ts               # Network calls (real fetch + local mock backend)
├── screens/
│   └── StreakAuthGate.tsx       # Screen composer: landing screen or real feature
├── styles/
│   └── styles.ts                # Shared visual styling rules for the module
├── constants.ts                 # Limits, timeouts, storage keys, API config
├── types.ts                     # TypeScript types (AuthUser, AuthMode, etc.)
├── validation.ts                # Field validation rules
└── README.md
```

**Note on `useAuth.tsx` (not `.ts`):** it returns JSX (`<AuthContext.Provider>`),
so it needs the `.tsx` extension to compile — the only deviation from a
strict 1:1 match with the flashcards module.

## 1. Install dependencies

```bash
npm install @react-native-async-storage/async-storage react-native-safe-area-context
```

(Skip `react-native-safe-area-context` if the app already depends on it —
`AuthModal.tsx` uses it for `SafeAreaView`.)

## 2. Copy the folder in

```bash
cp -r streak-auth client/src/features/streak-auth
```

## 3. Wire it into the Streak tab

Find wherever the Streak tab currently renders the Coming Soon screen and
replace it:

```tsx
import StreakAuthGate from '../features/streak-auth/screens/StreakAuthGate';
import CardScreen from '../features/flashcards/screens/CardScreen'; // or your real streak screen

<StreakAuthGate>
  <CardScreen />
</StreakAuthGate>
```

That's it — `StreakAuthGate` shows the login landing screen while logged
out, and swaps in the real screen the instant authentication succeeds (no
manual refresh, no re-navigating the tab).

If the app already has (or will have) a global `AuthProvider` at the root,
remove the inner `<AuthProvider>` from `screens/StreakAuthGate.tsx` — it's
wrapped locally so this feature works standalone until that exists.

## 4. Add Logout (Settings)

```tsx
import { useAuth } from '../features/streak-auth/hooks/useAuth';

function SettingsScreen() {
  const { logout, user } = useAuth();
  // <Button title="Log Out" onPress={logout} />
}
```

Calling `logout()` clears the persisted token, wipes the in-memory user,
and `StreakAuthGate` automatically falls back to the login landing screen.

## 5. Connect a real backend

Everything currently runs against a local mock backend (`AsyncStorage`-backed,
in `hooks/authApi.ts`) so the full flow — including "username already
exists" / "email already exists" — works with zero server setup.

To go live:

1. Open `constants.ts`.
2. Set `API_BASE_URL` to your real endpoint.
3. Set `USE_MOCK_BACKEND = false`.
4. Make sure your backend's error responses include a `code` field matching
   the ones handled in `hooks/authApi.ts`'s `mapServerError()`
   (`invalid_credentials`, `username_taken`, `email_taken`, `weak_password`),
   or extend that switch with your own codes.

No other file needs to change — `useAuth`, the forms, and the modal all
talk to `authApi`'s typed functions, not to `fetch` directly.

## Notes

- Session persists across app restarts/reboots via `AsyncStorage` and is
  only cleared on explicit logout (or if you set `expiresAt` and it lapses).
- Forgot Password always shows the same success message regardless of
  whether the email exists, per the spec (no account-enumeration leak).
- Password rule enforced client-side: 8+ characters, at least one letter
  and one number. Adjust in `validation.ts` / `constants.ts`.
- Swap the 🔥 emoji / icon circle in `screens/StreakAuthGate.tsx` for your
  actual app icon or Lottie mark if you have one.
