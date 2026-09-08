-- 0010_user_habits.sql
-- Per-user list of habits to track, configured in Settings and offered as a
-- checklist ("Completed today") on the daily entry's Habits card. Replaces the
-- previous hard-coded habit list. RLS scopes every row to its owner, mirroring
-- public.user_medications (migration 0006).
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

create table if not exists public.user_habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint user_habits_name_length check (char_length(name) between 1 and 120)
);

comment on table public.user_habits is 'Per-user list of habits, shown as a checklist on the daily entry.';

create index if not exists user_habits_user_idx
  on public.user_habits (user_id, is_active, sort_order);

alter table public.user_habits enable row level security;

drop policy if exists "user_habits: select own" on public.user_habits;
create policy "user_habits: select own"
  on public.user_habits for select
  using (user_id = auth.uid());

drop policy if exists "user_habits: insert own" on public.user_habits;
create policy "user_habits: insert own"
  on public.user_habits for insert
  with check (user_id = auth.uid());

drop policy if exists "user_habits: update own" on public.user_habits;
create policy "user_habits: update own"
  on public.user_habits for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_habits: delete own" on public.user_habits;
create policy "user_habits: delete own"
  on public.user_habits for delete
  using (user_id = auth.uid());
