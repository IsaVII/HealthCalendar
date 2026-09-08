import { describe, it, expect, vi } from 'vitest';

import {
  weatherGroup,
  geocode,
  fetchCurrentWeather,
  summarizeWeather,
} from './weatherApi';

const ok = (body) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

describe('weatherGroup', () => {
  it('maps WMO codes to translation groups', () => {
    expect(weatherGroup(0)).toBe('clear');
    expect(weatherGroup(2)).toBe('partlyCloudy');
    expect(weatherGroup(48)).toBe('fog');
    expect(weatherGroup(53)).toBe('drizzle');
    expect(weatherGroup(65)).toBe('rain');
    expect(weatherGroup(75)).toBe('snow');
    expect(weatherGroup(81)).toBe('showers');
    expect(weatherGroup(96)).toBe('thunderstorm');
    expect(weatherGroup(100)).toBe('unknown');
  });
});

describe('geocode', () => {
  it('resolves a place to a label and rounded coordinates', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      ok({ results: [{ name: 'Malmö', admin1: 'Skåne', country: 'Sweden', latitude: 55.60587, longitude: 13.00073 }] }),
    );
    const r = await geocode('malmo', { fetchFn });
    expect(r).toEqual({ label: 'Malmö, Skåne, Sweden', latitude: 55.6059, longitude: 13.0007 });
    expect(fetchFn.mock.calls[0][0]).toContain('name=malmo');
  });

  it('throws when nothing matches', async () => {
    const fetchFn = vi.fn().mockResolvedValue(ok({ results: [] }));
    await expect(geocode('zzz', { fetchFn })).rejects.toThrow('notFound');
  });

  it('throws on an empty query without calling the network', async () => {
    const fetchFn = vi.fn();
    await expect(geocode('  ', { fetchFn })).rejects.toThrow();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('fetchCurrentWeather', () => {
  it('requests current + daily and summarises both', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      ok({
        current: {
          temperature_2m: 8.4,
          relative_humidity_2m: 72,
          precipitation: 0.6,
          weather_code: 61,
          wind_speed_10m: 14.2,
          pressure_msl: 1007.6,
        },
        daily: {
          weather_code: [3],
          temperature_2m_max: [11.2],
          temperature_2m_min: [3.7],
          precipitation_sum: [4.25],
        },
      }),
    );
    const w = await fetchCurrentWeather(55.6, 13, { system: 'metric', fetchFn });
    expect(fetchFn.mock.calls[0][0]).toContain('temperature_unit=celsius');
    expect(fetchFn.mock.calls[0][0]).toContain('pressure_msl');
    expect(fetchFn.mock.calls[0][0]).toContain('daily=weather_code');
    expect(w).toEqual({
      now: 8,
      min: 4,
      max: 11,
      tempUnit: '°C',
      humidity: 72,
      precip: 0.6,
      rain: 4.3,
      precipUnit: 'mm',
      wind: 14,
      windUnit: 'km/h',
      pressure: 1008,
      group: 'rain',
      dayGroup: 'overcast',
    });
  });

  it('asks for imperial units when requested', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      ok({ current: { temperature_2m: 47, weather_code: 0, wind_speed_10m: 9 } }),
    );
    const w = await fetchCurrentWeather(1, 2, { system: 'imperial', fetchFn });
    expect(fetchFn.mock.calls[0][0]).toContain('temperature_unit=fahrenheit');
    expect(fetchFn.mock.calls[0][0]).toContain('precipitation_unit=inch');
    expect(w.tempUnit).toBe('°F');
    expect(w.windUnit).toBe('mph');
    expect(w.precipUnit).toBe('in');
  });

  it('rejects a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchCurrentWeather(1, 2, { fetchFn })).rejects.toThrow(/500/);
  });
});

describe('summarizeWeather', () => {
  it('falls back to current data when the daily block is missing', () => {
    const s = summarizeWeather(
      { temperature_2m: 20, weather_code: 3, wind_speed_10m: 5, precipitation: 1.2 },
      null,
      { temperatureUnit: 'celsius', windUnit: 'kmh', precipUnit: 'mm' },
    );
    expect(s).toMatchObject({
      now: 20,
      min: null,
      max: null,
      humidity: null,
      rain: 1.2,
      pressure: null,
      group: 'overcast',
      dayGroup: 'overcast',
    });
  });
});
