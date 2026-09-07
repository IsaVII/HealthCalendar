# HealthCalendar — Architecture

> Status: **foundation only**. This document describes the target architecture and
> what exists today. No health-tracking features are implemented yet — the current
> scope is a multi-language, mobile-friendly web app with a Supabase-backed
> authentication system (register / verify email / log in / log out).

---

## 1. Goals & constraints

| # | Requirement | Decision |
|---|-------------|----------|
| 1 | Web app that works well on mobile | Single responsive Vite + React SPA, mobile-first Tailwind. No native app for now, but code is layered so a React Native client could reuse the non-UI layers later. |
| 2 | State management | Redux Toolkit + react-redux. |
| 3 | Styling | Tailwind CSS v3 (mobile-first, `rem`/flex/grid, no fixed pixel layouts). |
| 4 | Multi-language | `i18next` + `react-i18next` + language detector. Ships with `en` and `sv`. Adding a language = one JSON file + one line. |
| 5 | Auth: username **or** email + password, with email verification | Supabase Auth (email+password, "Confirm email" enabled). Username lives in a `profiles` table; a `SECURITY DEFINER` RPC resolves username → email before sign-in. |
| 6 | Backend | Supabase (Postgres + Auth + RLS). Accessed only through `@supabase/supabase-js` from the client for now. |
| 7 | No TypeScript | Plain JavaScript (ESM, JSX). `jsconfig.json` for editor path hints only. |
| 8 | No health features yet | `src/features/health/` is intentionally absent. Section 8 shows where it will plug in. |

---

## 2. High-level shape

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                   │
│                                                          │
│  Pages  ─────────────►  Redux store  ◄──────  AuthProvider │
│  (routing)              (RTK slices)          (session     │
│     │                        │                 listener)   │
│     ▼                        ▼                             │
│  UI components          Feature services                  │
│  (Tailwind)             (AuthService, ProfileService)     │
│                              │                            │
└──────────────────────────────┼────────────────────────────┘
                               ▼
                     @supabase/supabase-js
                               │
┌──────────────────────────────┼────────────────────────────┐
│                        Supabase project                   │
│   Auth (GoTrue)   │   Postgres + RLS   │   RPC functions   │
│   - email/password│   - profiles      │   - email_for_    │
│   - confirm email │   - trigger on    │     identifier()  │
│                   │     auth.users    │   - username_     │
│                   │                   │     available()   │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Layers

The frontend is split so that **only the top layer knows it is React**, and
**only the bottom layer knows it is Supabase**. Swapping either end (native UI,
different backend) touches one layer.

| Layer | Location | Knows about | Never imports |
|-------|----------|-------------|---------------|
| **Presentation** | `src/pages`, `src/components`, `src/routes` | React, router, Tailwind, `react-i18next`, Redux hooks | `supabaseClient` directly |
| **State** | `src/app` (store), `src/features/*/*.slice.js`, `*.thunks.js`, `*.selectors.js` | Redux Toolkit, feature services | React, DOM |
| **Domain / services** | `src/features/*/*.service.js`, `src/lib` | Supabase client, plain data shapes | Redux, React |
| **Infrastructure** | `src/lib/supabaseClient.js`, `src/config/env.js` | `@supabase/supabase-js`, env vars | everything above |

Rule of thumb: **imports point downward only.** A component dispatches a thunk;
the thunk calls a service; the service calls Supabase. Components do not call
services, and services do not touch Redux.

---

## 4. Directory layout

```
HealthCalendar/
├── docs/
│   └── ARCHITECTURE.md            ← this file
├── supabase/
│   └── migrations/
│       └── 0001_auth_profiles.sql ← profiles table, trigger, RLS, RPCs
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
├── .env.example                   ← VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
└── src/
    ├── main.jsx                   ← app bootstrap (providers)
    ├── App.jsx                    ← <AppRouter/>
    ├── config/
    │   └── env.js                 ← reads + validates import.meta.env
    ├── lib/
    │   └── supabaseClient.js      ← single Supabase client instance
    ├── i18n/
    │   ├── index.js               ← i18next init
    │   └── locales/{en,sv}.json
    ├── app/
    │   ├── store.js               ← configureStore
    │   └── hooks.js               ← typed-ish useAppDispatch/useAppSelector
    ├── routes/
    │   ├── AppRouter.jsx          ← route table
    │   ├── ProtectedRoute.jsx     ← requires an authenticated + verified user
    │   └── PublicOnlyRoute.jsx    ← redirects logged-in users away from /login
    ├── components/
    │   ├── ui/                    ← Button, Input, FormField, Alert, Spinner
    │   ├── layout/                ← AppLayout, AuthLayout
    │   └── LanguageSwitcher.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── VerifyEmailPage.jsx
    │   ├── ForgotPasswordPage.jsx
    │   ├── ResetPasswordPage.jsx
    │   ├── DashboardPage.jsx      ← placeholder, no health data
    │   └── NotFoundPage.jsx
    └── features/
        └── auth/
            ├── AuthService.js     ← class: sign up / in / out, resend, resolve
            ├── ProfileService.js  ← class: profile read/update, username checks
            ├── authSlice.js       ← session + status + error state
            ├── authThunks.js      ← async actions wrapping the services
            ├── authSelectors.js   ← memo-friendly selectors
            └── AuthProvider.jsx   ← subscribes to Supabase auth changes
```

---

## 5. Authentication design

### 5.1 Data model

Supabase Auth owns `auth.users` (email, encrypted password, `email_confirmed_at`).
We add one table:

```
public.profiles
  id           uuid  PK  → references auth.users(id) on delete cascade
  username     citext  unique  (3–30 chars, [a-z0-9_])
  display_name text
  locale       text  default 'en'
  created_at   timestamptz default now()
  updated_at   timestamptz default now()
```

A trigger `on_auth_user_created` inserts a `profiles` row using
`raw_user_meta_data->>'username'` supplied at sign-up.

### 5.2 Registration flow

```
RegisterForm
  → validate (username rules, email format, password strength) client-side
  → dispatch registerUser({ username, email, password })
      → ProfileService.isUsernameAvailable(username)   (RPC: username_available)
      → AuthService.signUpWithEmail({ email, password, data:{ username } })
          → supabase.auth.signUp(...)   → Supabase sends confirmation email
  → navigate to /verify-email  (shows "check your inbox", resend button)
```

### 5.3 Login flow (username OR email)

```
LoginForm ({ identifier, password })
  → dispatch loginUser({ identifier, password })
      → if identifier looks like an email → email = identifier
        else → email = AuthService.resolveEmailForUsername(identifier)
                        (RPC: email_for_identifier, SECURITY DEFINER)
      → AuthService.signInWithEmail({ email, password })
          → supabase.auth.signInWithPassword(...)
      → if error is "Email not confirmed" → redirect to /verify-email
  → AuthProvider picks up SIGNED_IN → store.auth.session populated
  → ProtectedRoute lets the user into /dashboard
```

### 5.4 Session lifecycle

- `AuthProvider` calls `supabase.auth.getSession()` once on mount, then
  `supabase.auth.onAuthStateChange(cb)`.
- Every change dispatches `authSlice.sessionChanged(session)`.
- `supabase-js` persists the session in `localStorage` and auto-refreshes tokens.
- Logout = `AuthService.signOut()` → `SIGNED_OUT` event → store cleared →
  `ProtectedRoute` bounces to `/login`.

### 5.5 Email verification

- "Confirm email" is **on** in the Supabase dashboard (Auth → Providers → Email).
- After sign-up the user has a session but `user.email_confirmed_at` is null.
- `ProtectedRoute` requires `session && user.email_confirmed_at`; otherwise it
  redirects to `/verify-email`.
- `/verify-email` offers `AuthService.resendVerification(email)`.
- The confirmation link returns to `${VITE_SITE_URL}/verify-email` (configure
  the redirect URL allow-list in Supabase).

### 5.6 Password reset (included — it is part of a real login system)

`/forgot-password` → `supabase.auth.resetPasswordForEmail` → email link →
`/reset-password` → `supabase.auth.updateUser({ password })`.

### 5.7 Row-Level Security

```
profiles:
  enable RLS
  select: id = auth.uid()                 -- read only your own profile
  update: id = auth.uid()                  -- update only your own profile
  insert: handled by the trigger (definer) -- no direct client insert
```

Username lookup for login and availability checks must bypass RLS without
exposing the whole table, so they are `SECURITY DEFINER` functions with a
narrow return value:

| Function | Args | Returns | Purpose |
|----------|------|---------|---------|
| `public.username_available(name text)` | candidate username | `boolean` | Registration UX. |
| `public.email_for_identifier(identifier text)` | username | `text` (email) or null | Let the client resolve a username to its email before `signInWithPassword`. |

**Known tradeoff:** `email_for_identifier` lets someone map a username to an
email address (account-enumeration). Acceptable for the MVP. Hardening options,
in order of preference: (a) move the whole username-login into a Supabase Edge
Function that never returns the email, (b) add per-IP rate limiting, (c) require
a CAPTCHA/turnstile token. Tracked in section 9.

---

## 6. State management

One slice today: `auth`.

```
state.auth = {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated',
  session: null | { access_token, user, ... },
  user:    null | { id, email, email_confirmed_at, ... },
  profile: null | { username, display_name, locale },
  error:   null | { code, message },
}
```

- **Thunks** (`createAsyncThunk`) own all async work: `registerUser`,
  `loginUser`, `logoutUser`, `resendVerification`, `loadProfile`,
  `requestPasswordReset`, `resetPassword`.
- **Reducers** are synchronous and derive `status` from `session` +
  `email_confirmed_at`.
- **Selectors** (`authSelectors.js`) are the only way pages read auth state:
  `selectIsAuthenticated`, `selectIsEmailVerified`, `selectAuthUser`,
  `selectAuthStatus`, `selectAuthError`.
- The store is configured with `serializableCheck` tuned to ignore the Supabase
  session's non-serializable bits if needed (currently it is plain JSON).

Adding a feature = add `src/features/<name>/` with the same file set and register
its reducer in `src/app/store.js`.

---

## 7. Internationalisation

- `src/i18n/index.js` initialises i18next with `LanguageDetector`
  (order: `localStorage` → `navigator`), `fallbackLng: 'en'`.
- Namespaces: single `translation` namespace for now; split later
  (`auth`, `common`, `health`) when it grows.
- `<LanguageSwitcher/>` calls `i18n.changeLanguage(lng)` and persists to
  `localStorage`; when logged in it also writes `profile.locale`.
- All user-facing strings go through `t('key')`. No hard-coded copy in JSX.
- Keys are namespaced by area in the JSON: `auth.login.title`, `common.save`, …

---

## 8. Where health features will plug in (not built yet)

```
src/features/health/
  HealthService.js      ← CRUD against new tables via supabase-js
  healthSlice.js        ← entries, metrics, ranges
  healthThunks.js
  healthSelectors.js
  components/…

supabase/migrations/
  0002_health_entries.sql   ← tables + RLS (user_id = auth.uid())

src/routes/AppRouter.jsx    ← add /calendar, /entries/:id behind ProtectedRoute
src/components/layout/AppLayout.jsx ← add nav items
```

No existing file needs restructuring to add this — that is the point of the
layering in section 3.

---

## 9. Backlog / deferred decisions

- [ ] Harden username-login (Edge Function or rate limiting) — section 5.7.
- [ ] Split i18n namespaces once strings grow.
- [ ] Add e2e tests (Playwright) for the auth flows.
- [ ] Decide native client (React Native) vs PWA install for "mobile".
- [ ] CI: lint + build on PR.
- [ ] Error monitoring (Sentry) and analytics.
- [ ] `profiles.locale` write-back on language change.

---

## 10. Local setup

```bash
cp .env.example .env          # fill in Supabase URL + anon key
npm install
# apply supabase/migrations/0001_auth_profiles.sql to your project
#   (Supabase SQL editor, or `supabase db push` with the CLI)
npm run dev                   # http://localhost:5173
```

Supabase dashboard checklist:
1. Auth → Providers → Email → enable "Confirm email".
2. Auth → URL Configuration → add `http://localhost:5173` and your prod URL to
   the redirect allow-list.
3. Run the migration.
