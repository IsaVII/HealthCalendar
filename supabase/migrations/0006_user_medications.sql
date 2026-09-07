-- 0006_user_medications.sql
-- Regularly-taken medications, configured once per user in Settings and then
-- offered as a checklist on the daily health entry. RLS scopes every row to
-- its owner, mirroring public.health_entries (migration 0002).
--
-- Also adds profiles.default_height_cm so the BMI field on the entry form can
-- prefill a height the user rarely changes.
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

-- ---------------------------------------------------------------------------
-- user_medications
-- ---------------------------------------------------------------------------
create table if not exists public.user_medications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  dose        text,
  schedule    text,
  notes       text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint user_medications_name_length
    check (char_length(name) between 1 and 120),
  constraint user_medications_schedule_values
    check (schedule is null or schedule in
      ('daily', 'morning', 'evening', 'night', 'as_needed'))
);

comment on table public.user_medications is 'Per-user list of regular medications, shown as a checklist on the daily entry.';

create index if not exists user_medications_user_idx
  on public.user_medications (user_id, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Row-Level Security: a user only ever sees or writes their own rows.
-- ---------------------------------------------------------------------------
alter table public.user_medications enable row level security;

drop policy if exists "user_medications: select own" on public.user_medications;
create policy "user_medications: select own"
  on public.user_medications for select
  using (user_id = auth.uid());

drop policy if exists "user_medications: insert own" on public.user_medications;
create policy "user_medications: insert own"
  on public.user_medications for insert
  with check (user_id = auth.uid());

drop policy if exists "user_medications: update own" on public.user_medications;
create policy "user_medications: update own"
  on public.user_medications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_medications: delete own" on public.user_medications;
create policy "user_medications: delete own"
  on public.user_medications for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- profiles.default_height_cm
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists default_height_cm numeric(5, 1);

alter table public.profiles
  drop constraint if exists profiles_default_height_cm_range;
alter table public.profiles
  add constraint profiles_default_height_cm_range
    check (default_height_cm is null or default_height_cm between 30 and 260);
