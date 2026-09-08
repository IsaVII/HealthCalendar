-- 0008_profiles_unit_system.sql
-- One switch for the measurement system the daily entry form shows. Values are
-- always stored canonically (metric) in health_entries.data; this column only
-- controls how the numbers are entered and displayed.
--   'metric'   -> kg, cm, °C, mmol/L, L
--   'imperial' -> lb, in, °F, mg/dL, fl oz
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

alter table public.profiles
  add column if not exists unit_system text not null default 'metric';

alter table public.profiles
  drop constraint if exists profiles_unit_system_allowed;
alter table public.profiles
  add constraint profiles_unit_system_allowed
    check (unit_system in ('metric', 'imperial'));
