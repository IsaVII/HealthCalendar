-- 0002_health_entries.sql
-- First health-tracking table: one row per user per day, holding the day's
-- health data. RLS scopes every row to its owner (user_id = auth.uid()).
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

-- ---------------------------------------------------------------------------
-- health_entries
-- ---------------------------------------------------------------------------
create table if not exists public.health_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date    date not null default current_date,
  pain_level    smallint,
  sleep_hours   numeric(4, 2),
  sleep_quality text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint health_entries_pain_level_range
    check (pain_level is null or pain_level between 0 and 10),
  constraint health_entries_sleep_hours_range
    check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24)),
  constraint health_entries_sleep_quality_values
    check (sleep_quality is null or sleep_quality in ('poor', 'fair', 'good', 'excellent')),

  -- One entry per day. The client upserts on this to "load if it exists".
  constraint health_entries_user_date_unique unique (user_id, entry_date)
);

comment on table public.health_entries is 'One row per user per day of self-reported health data.';

-- ---------------------------------------------------------------------------
-- Row-Level Security: a user only ever sees or writes their own rows.
-- ---------------------------------------------------------------------------
alter table public.health_entries enable row level security;

drop policy if exists "health_entries: select own" on public.health_entries;
create policy "health_entries: select own"
  on public.health_entries for select
  using (user_id = auth.uid());

drop policy if exists "health_entries: insert own" on public.health_entries;
create policy "health_entries: insert own"
  on public.health_entries for insert
  with check (user_id = auth.uid());

drop policy if exists "health_entries: update own" on public.health_entries;
create policy "health_entries: update own"
  on public.health_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "health_entries: delete own" on public.health_entries;
create policy "health_entries: delete own"
  on public.health_entries for delete
  using (user_id = auth.uid());
