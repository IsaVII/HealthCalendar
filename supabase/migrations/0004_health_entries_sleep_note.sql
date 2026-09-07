-- 0004_health_entries_sleep_note.sql
-- Adds a free-text sleep note so the user can describe the night in their own
-- words (e.g. "woke up 3 times") alongside the coarse sleep_quality bucket.
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

alter table public.health_entries
  add column if not exists sleep_note text;

alter table public.health_entries
  drop constraint if exists health_entries_sleep_note_length;
alter table public.health_entries
  add constraint health_entries_sleep_note_length
    check (sleep_note is null or char_length(sleep_note) <= 500);
