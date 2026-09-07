# HealthCalendar

A mobile-friendly web app that will track personal health data. **This repo is
the foundation only** — multi-language UI, Redux state, and a Supabase-backed
auth system (register → verify email → log in / out). No health features yet.

- **Architecture:** see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — read this first.
- **Stack:** Vite + React 18 (JavaScript, no TypeScript), Redux Toolkit,
  React Router, Tailwind CSS, `react-i18next`, `@supabase/supabase-js`.

## Getting started

```bash
cp .env.example .env      # fill in your Supabase URL + anon key
npm install
npm run dev                # http://localhost:5173  (also on your LAN IP for phones)
```

### Supabase setup

1. Create a project at supabase.com.
2. SQL editor → run `supabase/migrations/0001_auth_profiles.sql`.
3. Auth → Providers → Email → enable **Confirm email**.
4. Auth → URL Configuration → add `http://localhost:5173` (and your prod URL)
   to the redirect allow-list.
5. Settings → API → copy the Project URL and `anon` key into `.env`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run lint` | ESLint |

## Project layout

Short version (full tree in the architecture doc):

```
src/
  app/        Redux store + hooks
  config/     env validation
  lib/        Supabase client (the only file that imports supabase-js)
  i18n/       i18next setup + locale JSON (en, sv)
  features/
    auth/     AuthService, ProfileService, slice, thunks, selectors, AuthProvider
  components/ ui/, layout/, LanguageSwitcher
  routes/     AppRouter + route guards
  pages/      Login, Register, VerifyEmail, Forgot/ResetPassword, Dashboard
```

## Adding a language

1. Add `src/i18n/locales/<code>.json` (copy `en.json`).
2. Register it in `src/i18n/index.js` (`resources` + `SUPPORTED_LANGUAGES`).
