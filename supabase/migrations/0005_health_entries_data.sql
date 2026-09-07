-- 0005_health_entries_data.sql
-- Widens a health entry from the original four typed columns to an open-ended
-- per-day document. The flexible fields (meals, body metrics, activity,
-- symptoms, mood, cycle, environment, illness, habits, medication) live in a
-- single `data` jsonb object whose shape is owned by the client
-- (src/features/health/healthSchema.js).
--
-- The four legacy columns stay: the calendar overview keeps reading
-- pain_level / sleep_* directly, and the client mirrors the matching schema
-- fields into them on every save.
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

alter table public.health_entries
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.health_entries
  drop constraint if exists health_entries_data_is_object;
alter table public.health_entries
  add constraint health_entries_data_is_object
    check (jsonb_typeof(data) = 'object');
