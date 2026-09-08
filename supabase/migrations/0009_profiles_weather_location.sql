-- 0009_profiles_weather_location.sql
-- The place the "Get weather" button on the daily entry fetches conditions for.
-- Set in Settings: the user types a town, we geocode it once (Open-Meteo) and
-- store the resolved label plus its coordinates.
--
-- Apply with the Supabase SQL editor, or `supabase db push` via the CLI.

alter table public.profiles
  add column if not exists weather_location text;
alter table public.profiles
  add column if not exists weather_lat numeric(8, 4);
alter table public.profiles
  add column if not exists weather_lon numeric(8, 4);

alter table public.profiles
  drop constraint if exists profiles_weather_coords_range;
alter table public.profiles
  add constraint profiles_weather_coords_range
    check (
      (weather_lat is null or weather_lat between -90 and 90)
      and (weather_lon is null or weather_lon between -180 and 180)
    );
