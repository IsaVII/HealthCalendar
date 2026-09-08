/**
 * Thin wrapper around Open-Meteo — a free, key-less, CORS-enabled weather API
 * (https://open-meteo.com). Two calls:
 *   geocode(name)               -> resolve a town to a label + coordinates
 *   fetchCurrentWeather(lat,lon) -> conditions now + today's forecast
 *
 * `summarizeWeather` folds the WMO weather codes into a small set of groups the
 * UI translates; formatting into a sentence happens in the component so it can
 * use i18n.
 */

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/** WMO weather code → a translation group key. */
export function weatherGroup(code) {
  const c = Number(code);
  if (c === 0) return 'clear';
  if (c === 1) return 'mainlyClear';
  if (c === 2) return 'partlyCloudy';
  if (c === 3) return 'overcast';
  if (c === 45 || c === 48) return 'fog';
  if (c >= 51 && c <= 57) return 'drizzle';
  if ((c >= 61 && c <= 65) || c === 66 || c === 67) return 'rain';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if (c >= 80 && c <= 82) return 'showers';
  if (c >= 95 && c <= 99) return 'thunderstorm';
  return 'unknown';
}

async function getJson(url, fetchFn) {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  return res.json();
}

/**
 * Resolve a place name to `{ label, latitude, longitude }`, or throw when
 * nothing matches.
 */
export async function geocode(name, { language = 'en', fetchFn = fetch } = {}) {
  const q = String(name || '').trim();
  if (!q) throw new Error('empty');
  const url = `${GEO_URL}?name=${encodeURIComponent(q)}&count=1&language=${language}&format=json`;
  const data = await getJson(url, fetchFn);
  const hit = data.results?.[0];
  if (!hit) throw new Error('notFound');
  const parts = [hit.name, hit.admin1, hit.country].filter(Boolean);
  // Drop admin1 when it just repeats the town name (e.g. "Berlin, Berlin").
  const label = parts.filter((p, i) => i === 0 || p !== parts[0]).join(', ');
  return {
    label,
    latitude: Math.round(hit.latitude * 1e4) / 1e4,
    longitude: Math.round(hit.longitude * 1e4) / 1e4,
  };
}

/** Conditions now plus today's forecast for a coordinate, in the chosen units. */
export async function fetchCurrentWeather(
  lat,
  lon,
  { system = 'metric', fetchFn = fetch } = {},
) {
  const temperatureUnit = system === 'imperial' ? 'fahrenheit' : 'celsius';
  const windUnit = system === 'imperial' ? 'mph' : 'kmh';
  const precipUnit = system === 'imperial' ? 'inch' : 'mm';
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,pressure_msl` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=1&temperature_unit=${temperatureUnit}&wind_speed_unit=${windUnit}` +
    `&precipitation_unit=${precipUnit}&timezone=auto`;
  const data = await getJson(url, fetchFn);
  if (!data.current) throw new Error('noData');
  return summarizeWeather(data.current, data.daily, { temperatureUnit, windUnit, precipUnit });
}

const round1 = (n) => Math.round(n * 10) / 10;
const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : null);

/**
 * Normalise Open-Meteo's `current` + `daily` blocks into what the UI renders:
 * conditions now (`group`), the day's dominant forecast (`dayGroup`), its
 * temperature range and total precipitation.
 */
export function summarizeWeather(current, daily, { temperatureUnit, windUnit, precipUnit }) {
  const dayMin = daily ? first(daily.temperature_2m_min) : null;
  const dayMax = daily ? first(daily.temperature_2m_max) : null;
  const dayCode = daily ? first(daily.weather_code) : null;
  const daySum = daily ? first(daily.precipitation_sum) : null;
  const nowPrecip = current.precipitation == null ? 0 : round1(current.precipitation);

  return {
    now: Math.round(current.temperature_2m),
    min: dayMin == null ? null : Math.round(dayMin),
    max: dayMax == null ? null : Math.round(dayMax),
    tempUnit: temperatureUnit === 'fahrenheit' ? '°F' : '°C',
    humidity:
      current.relative_humidity_2m == null ? null : Math.round(current.relative_humidity_2m),
    precip: nowPrecip,
    rain: daySum == null ? nowPrecip : round1(daySum),
    precipUnit: precipUnit === 'inch' ? 'in' : 'mm',
    wind: Math.round(current.wind_speed_10m),
    windUnit: windUnit === 'mph' ? 'mph' : 'km/h',
    pressure: current.pressure_msl == null ? null : Math.round(current.pressure_msl),
    group: weatherGroup(current.weather_code),
    dayGroup: dayCode == null ? weatherGroup(current.weather_code) : weatherGroup(dayCode),
  };
}
