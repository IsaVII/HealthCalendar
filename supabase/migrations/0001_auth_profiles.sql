-- 0001_auth_profiles.sql
-- Foundation auth schema: a profiles table linked to auth.users, a trigger that
-- provisions it at sign-up, RLS so users only see their own row, and two
-- SECURITY DEFINER RPCs that support "log in with username or email".
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

-- Case-insensitive text for usernames.
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     citext not null unique,
  display_name text,
  locale       text not null default 'en',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]{3,30}$')
);

comment on table public.profiles is 'Public-facing user data. One row per auth.users row.';

-- ---------------------------------------------------------------------------
-- Provision a profile whenever an auth user is created.
-- The username comes from the sign-up call: options.data.username
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- No INSERT/DELETE policy: rows are created by the trigger (definer) and
-- removed by the cascade from auth.users.

-- ---------------------------------------------------------------------------
-- RPC: is a username still free?  (used by the registration form)
-- ---------------------------------------------------------------------------
create or replace function public.username_available(name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.profiles where username = lower(name));
$$;

-- ---------------------------------------------------------------------------
-- RPC: resolve a username to its email so the client can call
-- signInWithPassword. Returns NULL when there is no match.
--
-- TRADEOFF: this lets a caller map a username -> email (account enumeration).
-- Acceptable for the MVP. Harden later by moving username-login into an Edge
-- Function that never returns the email, and/or add rate limiting.
-- ---------------------------------------------------------------------------
create or replace function public.email_for_identifier(identifier text)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result text;
begin
  select u.email
    into result
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.username = lower(identifier)
   limit 1;

  return result;
end;
$$;

-- Allow anonymous (pre-login) callers to use the two RPCs.
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.email_for_identifier(text) to anon, authenticated;
