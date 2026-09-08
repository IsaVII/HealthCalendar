import { describe, it, expect } from 'vitest';

import {
  parseIso,
  toIso,
  addDays,
  addMonths,
  addYears,
  startOfMonth,
  sameMonth,
  monthMatrix,
  monthsOfYear,
  rangeForView,
  weekdayLabels,
  monthLabel,
  painBucket,
  painColor,
  PAIN_BUCKETS,
  waterFill,
  summariseEntry,
} from './calendarUtils';

describe('iso <-> Date', () => {
  it('round-trips a local date without a timezone shift', () => {
    expect(toIso(parseIso('2026-03-09'))).toBe('2026-03-09');
  });
});

describe('date arithmetic', () => {
  it('adds days across a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('adds months and years anchored to the 1st', () => {
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01');
    expect(addYears('2026-06-15', 2)).toBe('2028-06-01');
  });
  it('startOfMonth / sameMonth', () => {
    expect(startOfMonth('2026-07-22')).toBe('2026-07-01');
    expect(sameMonth('2026-07-01', '2026-07-31')).toBe(true);
    expect(sameMonth('2026-07-01', '2026-08-01')).toBe(false);
  });
});

describe('monthMatrix', () => {
  const weeks = monthMatrix('2026-02-10'); // Feb 2026 starts on a Sunday
  it('is a grid of full weeks starting on Monday', () => {
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().length % 7).toBe(0);
  });
  it('marks in-month vs adjacent days and stays contiguous', () => {
    const flat = weeks.flat();
    expect(flat[0].inMonth).toBe(false); // leading day from January
    const inMonth = flat.filter((c) => c.inMonth);
    expect(inMonth[0].iso).toBe('2026-02-01');
    expect(inMonth.at(-1).iso).toBe('2026-02-28');
    for (let i = 1; i < flat.length; i += 1) {
      expect(addDays(flat[i - 1].iso, 1)).toBe(flat[i].iso);
    }
  });
});

describe('rangeForView', () => {
  it('year view spans Jan 1 to Dec 31', () => {
    expect(rangeForView('year', '2026-05-05')).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });
  it('month view spans the visible grid', () => {
    const { from, to } = rangeForView('month', '2026-02-10');
    expect(from <= '2026-02-01').toBe(true);
    expect(to >= '2026-02-28').toBe(true);
  });
  it('monthsOfYear returns 12 anchor dates', () => {
    const months = monthsOfYear('2026-01-01');
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2026-01-01');
    expect(months[11]).toBe('2026-12-01');
  });
});

describe('labels', () => {
  it('weekdayLabels has 7 entries starting Monday', () => {
    const labels = weekdayLabels('en');
    expect(labels).toHaveLength(7);
    expect(labels[0].toLowerCase()).toMatch(/^m/);
  });
  it('monthLabel formats via Intl', () => {
    expect(monthLabel('en', '2026-02-01')).toMatch(/February/i);
  });
});

describe('pain colour buckets', () => {
  it('buckets two levels per colour, clamped to 0..10', () => {
    expect(painBucket(0)).toBe(0);
    expect(painBucket(3)).toBe(1);
    expect(painBucket(10)).toBe(5);
    expect(painBucket(99)).toBe(5);
    expect(painBucket(-5)).toBe(0);
  });
  it('painColor returns a class, neutral for a null level', () => {
    expect(painColor(0)).toBe(PAIN_BUCKETS[0].className);
    expect(painColor(10)).toBe(PAIN_BUCKETS[5].className);
    expect(painColor(null)).toBe('bg-slate-400');
    expect(painColor(undefined)).toBe('bg-slate-400');
  });
});

describe('waterFill', () => {
  it('is half at 1 L, full at 2 L, clamped', () => {
    expect(waterFill(0)).toBe(0);
    expect(waterFill(1)).toBe(0.5);
    expect(waterFill(2)).toBe(1);
    expect(waterFill(3)).toBe(1);
    expect(waterFill(-1)).toBe(0);
  });
});

describe('summariseEntry', () => {
  const entry = (data, cols = {}) => ({ entry_date: '2026-01-02', ...cols, data });

  it('returns null for a missing entry', () => {
    expect(summariseEntry(null)).toBeNull();
  });

  it('reads period flow only when the period is active', () => {
    expect(summariseEntry(entry({ cycle: { periodActive: true, flow: 'heavy' } })).flow).toBe(
      'heavy',
    );
    expect(summariseEntry(entry({ cycle: { periodActive: false, flow: 'heavy' } })).flow).toBe(
      null,
    );
    // active but no flow value -> a sensible default so the dot still shows
    expect(summariseEntry(entry({ cycle: { periodActive: true } })).flow).toBe('light');
  });

  it('pulls litres, mood and exercise from the data blob', () => {
    const s = summariseEntry(
      entry({
        meals: { waterGlasses: '1.5' },
        mood: { mood: '4' },
        activity: { exerciseMin: '30' },
      }),
    );
    expect(s.waterL).toBe(1.5);
    expect(s.mood).toBe(4);
    expect(s.exercised).toBe(true);
  });

  it('flags short or poor sleep, ignoring unlogged nights', () => {
    expect(summariseEntry(entry({}, { sleep_hours: 5 })).poorSleep).toBe(true);
    expect(summariseEntry(entry({}, { sleep_quality: 'poor' })).poorSleep).toBe(true);
    expect(summariseEntry(entry({}, { sleep_hours: 8 })).poorSleep).toBe(false);
    expect(summariseEntry(entry({})).poorSleep).toBe(false);
  });

  it('drops indicators for hidden categories and fields', () => {
    const data = {
      cycle: { periodActive: true, flow: 'medium' },
      meals: { waterGlasses: '2' },
      mood: { mood: '5' },
    };
    const s = summariseEntry(entry(data), ['cycle', 'meals.waterGlasses']);
    expect(s.flow).toBeNull();
    expect(s.waterL).toBeNull();
    expect(s.mood).toBe(5);
  });
});
