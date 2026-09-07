-- 0007_profiles_hidden_health_fields.sql
-- Lets a user hide daily-entry categories or individual fields they don't need
-- (e.g. never drinks caffeine). Stored as a jsonb array of tokens:
--   "meals"                 -> the whole Meals category is hidden
--   "meals.caffeineCups"    -> just that field is hidden
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

alter table public.profiles
  add column if not exists hidden_health_fields jsonb not null default '[]'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_hidden_health_fields_is_array;
alter table public.profiles
  add constraint profiles_hidden_health_fields_is_array
    check (jsonb_typeof(hidden_health_fields) = 'array');
