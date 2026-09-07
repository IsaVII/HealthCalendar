# HealthCalendar

[![CI](https://github.com/IsaVII/HealthCalendar/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaVII/HealthCalendar/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/IsaVII/HealthCalendar/actions/workflows/deploy.yml/badge.svg)](https://github.com/IsaVII/HealthCalendar/actions/workflows/deploy.yml)

A mobile-friendly web app for tracking personal health data day by day: a
categorized daily entry (meals, body metrics, sleep, activity, symptoms with a
headache/migraine trigger checklist, medication, mood, cycle, environment,
illness, habits), a month/year calendar coloured by pain level, and a settings
page for the medications you take regularly and for hiding fields you don't use.

- **Live:** https://isavii.github.io/HealthCalendar/
- **Architecture:** see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — read this first.
- **Stack:** Vite + React 18 (JavaScript, no TypeScript), Redux Toolkit,
  React Router, Tailwind CSS, `react-i18next` (en / sv / de),
  `@supabase/supabase-js`, Vitest + Testing Library.

## Getting started

```bash
cp .env.example .env      # fill in your Supabase URL + anon key
npm install
npm run dev                # http://localhost:5173  (also on your LAN IP for phones)
```

### Supabase setup

1. Create a project at supabase.com.
2. SQL editor → run the files in `supabase/migrations/` **in order**
   (`0001` … `0007`), or `supabase db push` with the CLI.
3. Auth → Providers → Email → enable **Confirm email**.
4. Auth → URL Configuration → add `http://localhost:5173` and the deployed URL
   (`https://isavii.github.io/HealthCalendar/`) to the redirect allow-list.
5. Settings → API → copy the Project URL and `anon` key into `.env`.

## Scripts

| Command              | Does                                       |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Dev server with HMR                        |
| `npm run build`      | Production build to `dist/`                |
| `npm run preview`    | Serve the build locally                    |
| `npm run lint`       | ESLint                                     |
| `npm test`           | Run the Vitest suite once                  |
| `npm run test:watch` | Vitest in watch mode                       |
| `npm run coverage`   | Vitest + v8 coverage report in `coverage/` |

## Tests

Vitest (jsdom) + `@testing-library/react`. Config lives in `vite.config.js`
under `test`; helpers are in `src/test/`. Suites cover the service classes
(mock Supabase client), the Redux slices, the pure logic
(`healthSchema`, `calendarUtils`, `validation`, …), key components
(`FieldRenderer`, `CategoryCard`), a `SettingsPage` integration test, and a
static check over the SQL migrations. Tests live next to their source as
`*.test.js(x)`.

## Deployment

Pushing to `master` runs:

- **[CI](.github/workflows/ci.yml)** — lint → coverage → build.
- **[Deploy to GitHub Pages](.github/workflows/deploy.yml)** — builds with the
  project base path (`/HealthCalendar/`) and publishes `dist` (plus a `404.html`
  copy of `index.html` so deep links resolve).

One-time repo setup:

1. **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables** → add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Add the Pages URL to Supabase Auth → URL Configuration (step 4 above).

## Project layout

Short version (full tree in the architecture doc):

```
src/
  app/        Redux store + hooks
  config/     env validation
  lib/        Supabase client (the only file that imports supabase-js)
  i18n/       i18next setup + locale JSON (en, sv, de)
  test/       Vitest setup + renderWithProviders helper
  features/
    auth/     AuthService, ProfileService, slice, thunks, selectors, AuthProvider
    health/   HealthService, MedicationService, healthSchema (entry-form config),
              slices, thunks, selectors, calendar utils, components
    theme/    light / dark mode
  components/ ui/, layout/, LanguageSwitcher
  routes/     AppRouter + route guards
  pages/      Login, Register, VerifyEmail, Forgot/ResetPassword,
              Dashboard, HealthEntry, Calendar, Settings
supabase/migrations/   0001 … 0007  (schema + RLS, each idempotent)
```

## Adding a language

1. Add `src/i18n/locales/<code>.json` (copy `en.json` — keep the same key tree).
2. Register it in `src/i18n/index.js` (`resources` + `SUPPORTED_LANGUAGES`).

## Adding a health field

Add an entry to `CATEGORIES` in `src/features/health/healthSchema.js` and the
matching i18n keys (`health.categories.*`, `health.fields.*`,
`health.options.*`) in every locale. The daily entry, the status dots, the
settings visibility toggles and `defaultData()` all follow from the config.
