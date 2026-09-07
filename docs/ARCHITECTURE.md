# HealthCalendar — Architecture

> Status: **foundation + first health feature**. This document describes the target
> architecture and what exists today: a multi-language, mobile-friendly web app
> with Supabase-backed auth (register / verify email / log in / log out), a
> daily health-data entry page (`/health`) and a month/year calendar overview
> (`/calendar`) — see section 8.

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
│       ├── 0001_auth_profiles.sql  ← profiles table, trigger, RLS, RPCs
│       ├── 0002_health_entries.sql ← daily health_entries table + RLS
│       ├── 0003_profiles_locale.sql ← adds profiles.locale if the table pre-existed
│       ├── 0004_health_entries_sleep_note.sql ← adds free-text health_entries.sleep_note
│       ├── 0005_health_entries_data.sql ← adds health_entries.data jsonb (all non-legacy fields)
│       ├── 0006_user_medications.sql ← user_medications table + RLS; profiles.default_height_cm
│       └── 0007_profiles_hidden_health_fields.sql ← profiles.hidden_health_fields (hide entry fields)
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
    │   ├── HealthEntryPage.jsx    ← daily health-data form (/health)
    │   ├── CalendarPage.jsx       ← month/year overview (/calendar)
    │   └── NotFoundPage.jsx
    └── features/
        ├── auth/
        │   ├── AuthService.js     ← class: sign up / in / out, resend, resolve
        │   ├── ProfileService.js  ← class: profile read/update, username checks
        │   ├── authSlice.js       ← session + status + error state
        │   ├── authThunks.js      ← async actions wrapping the services
        │   ├── authSelectors.js   ← memo-friendly selectors
        │   └── AuthProvider.jsx   ← subscribes to Supabase auth changes
        └── health/
            ├── HealthService.js   ← class: getEntryByDate / listEntries / saveEntry (upsert)
            ├── healthSlice.js     ← day in view + calendar overview state
            ├── healthThunks.js    ← loadEntryForDate / loadEntriesInRange / saveEntryForDate
            ├── healthSelectors.js ← memo-friendly selectors
            ├── healthConstants.js ← enums, ranges, todayIso(), entry⇄form mappers
            ├── calendarUtils.js   ← pure date math + pain→colour scale
            └── components/        ← MonthGrid, YearGrid
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

Two slices: `auth` and `health` (section 8).

```
state.auth = {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated',
  session: null | { access_token, user, ... },
  user:    null | { id, email, email_confirmed_at, ... },
  profile: null | { username, display_name, locale, default_height_cm, hidden_health_fields },
  error:   null | { code, message },
}

state.health = {
  // entry form
  date, entry, loadStatus, saving, savedAt, error,
  // calendar overview
  calendarView: 'month' | 'year',
  calendarCursor: 'YYYY-MM-DD',
  entriesByDate: { 'YYYY-MM-DD': { pain_level, sleep_hours, sleep_quality } },
  rangeStatus, rangeError,
  // regular medications (managed on /settings)
  medications: { items: [], status, error },
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
- Locales: `en`, `sv`, `de` (`SUPPORTED_LANGUAGES` in `src/i18n/index.js`); each
  is one `locales/<code>.json` with the same key tree. Add a language = add the
  file + one `SUPPORTED_LANGUAGES` entry + one `resources` entry.
- Namespaces: single `translation` namespace for now; split later
  (`auth`, `common`, `health`) when it grows.
- `<LanguageSwitcher/>` calls `i18n.changeLanguage(lng)` and persists to
  `localStorage`; when logged in it also writes `profile.locale`.
- All user-facing strings go through `t('key')`. No hard-coded copy in JSX.
- Keys are namespaced by area in the JSON: `auth.login.title`, `common.save`, …

---

## 8. Health data (built)

Three pages: `/health` records one entry per day (11 collapsible categories);
`/calendar` shows those entries across a month or a year; `/settings` manages the
user's regular-medication list.

```
src/features/health/
  HealthService.js       ← getEntryByDate(date) / listEntries(from,to) / saveEntry(date,values)
  MedicationService.js   ← list/create/update/delete user_medications
  healthThunks.js        ← loadEntryForDate, loadEntriesInRange, saveEntryForDate
  medicationThunks.js    ← loadMedications, add/update/removeMedication
  healthSlice.js         ← entry-form state + calendar state + medications sub-state
  healthSelectors.js     ← the only way pages read health state
  healthConstants.js     ← todayIso(), isIsoDate(), entryToForm/formToValues mappers
  healthSchema.js        ← CATEGORIES config (the source of truth for the entry form;
                           a category may carry an explicit `rows` layout, e.g. meals),
                           OPTIONS, defaultData, categoryStatus, computeBmi, mergeData,
                           deriveLegacyColumns, visibleCategories (drops the user's
                           hidden categories/fields per profiles.hidden_health_fields)
  calendarUtils.js       ← date math, Intl labels, painColor(level)
  components/CategoryCard.jsx  ← one <details> category card; status dot + field count;
                                 open state persisted in localStorage (health.cat.<id>)
  components/FieldRenderer.jsx ← renders one field by type (number/text/time/select/
                                 textarea/toggle/multi/meds/bmi)
  components/MonthGrid.jsx / YearGrid.jsx  ← calendar grids

src/pages/HealthEntryPage.jsx  ← categories, expand/collapse all, sticky Save; ?date=YYYY-MM-DD
src/pages/CalendarPage.jsx     ← header (view toggle, prev/next, today) + grid
src/pages/SettingsPage.jsx     ← medication list + add form + default height
supabase/migrations/0002,0005,0006
```

**Data model** — `public.health_entries`:

```
id            uuid  PK  default gen_random_uuid()
user_id       uuid  → auth.users(id) on delete cascade,  default auth.uid()
entry_date    date  default current_date
pain_level    smallint      (0–10, nullable)      ┐ legacy typed columns; the calendar
sleep_hours   numeric(4,2)  (0–24, nullable)      │ reads these directly. The client
sleep_quality text          (poor|fair|good|excellent) │ mirrors the matching schema
sleep_note    text          (≤500 chars, nullable)     ┘ fields into them on every save.
data          jsonb  not null default '{}'  ← everything else, shape owned by healthSchema.js
created_at / updated_at timestamptz
unique (user_id, entry_date)
```

`public.user_medications`: id, user_id, name, dose, schedule
(`daily|morning|evening|night|as_needed`), notes, is_active, sort_order. RLS
`user_id = auth.uid()` on all four verbs, mirroring health_entries.
`profiles.default_height_cm` prefills the BMI height field.
`profiles.hidden_health_fields` is a jsonb array of tokens (`"meals"` hides a
whole category, `"meals.caffeineCups"` hides one field); `/settings` edits it and
`visibleCategories()` applies it on `/health`.

RLS on health_entries: every policy is `user_id = auth.uid()` (select / insert / update / delete).

**Entry `data` shape:** `{ [categoryId]: { [fieldKey]: value } }` — value is `''`,
a number-string, `boolean` (toggle), `string[]` (multi), or `{ [medId]: "HH:MM"|true }`
(meds). `mergeData` fills every field over `defaultData()` on load so entries saved
before a field existed still render. `categoryStatus` counts non-empty fields for the
card's green/grey dot + badge. Adding a field or category = one entry in `CATEGORIES`
plus its i18n keys (`health.categories.*`, `health.fields.*`, `health.options.*`).

**Entry flow (`/health`):** the page defaults `entry_date` to today (or `?date=`
from a calendar click). `loadEntryForDate` fetches the row for that date; if one
exists the form is pre-filled, otherwise it is blank. `saveEntryForDate` upserts
on `(user_id, entry_date)`, so re-saving a day edits its row rather than creating
a duplicate. Changing the date input reloads and updates the URL.

**Calendar flow (`/calendar`):** `calendarView` (`'month'|'year'`) and
`calendarCursor` (any day inside the visible period) live in the slice.
`rangeForView` turns them into a `[from, to]`; `loadEntriesInRange` fetches that
window into `entriesByDate` (a `date → row` map). Each day cell is coloured by
`painColor(pain_level)` — six green→red buckets, two levels each (0–1 … 10) —
or neutral when logged without a pain value. Month/weekday names come from `Intl.DateTimeFormat` keyed on the active
i18n language, not the locale JSON. Clicking a day opens `/health?date=…`;
clicking a month tile in year view drops into that month.

Adding the next feature (trends, more metrics) follows the same file set — no
existing file needs restructuring, which is the point of the layering in
section 3.

---

## 9. Backlog / deferred decisions

- [ ] Harden username-login (Edge Function or rate limiting) — section 5.7.
- [ ] Split i18n namespaces once strings grow.
- [ ] Add e2e tests (Playwright) for the auth flows.
- [ ] Decide native client (React Native) vs PWA install for "mobile".
- [ ] CI: lint + build on PR.
- [ ] Error monitoring (Sentry) and analytics.
- [ ] `profiles.locale` write-back on language change.
- [ ] Pattern analysis over `data`: headache-trigger correlation, weight/BMI trends.
- [ ] Surface `data` richness (beyond pain level) on the calendar grid.

---

## 10. Local setup

```bash
cp .env.example .env          # fill in Supabase URL + anon key
npm install
# apply supabase/migrations/*.sql to your project, in order
#   (Supabase SQL editor, or `supabase db push` with the CLI)
npm run dev                   # http://localhost:5173
```

Supabase dashboard checklist:
1. Auth → Providers → Email → enable "Confirm email".
2. Auth → URL Configuration → add `http://localhost:5173` and your prod URL to
   the redirect allow-list.
3. Run the migrations in order (`0001`, `0002`, `0003`). `0003` only matters if
   the project's `profiles` table pre-dates this app (it did on the first
   deployment — a leftover table without a `locale` column made every profile
   fetch 400).
