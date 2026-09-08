import { describe, it, expect } from 'vitest';

import {
  CATEGORIES,
  OPTIONS,
  defaultData,
  fieldHasValue,
  categoryStatus,
  computeBmi,
  mergeData,
  deriveLegacyColumns,
  isFieldHidden,
  visibleCategories,
} from './healthSchema';

const cat = (id) => CATEGORIES.find((c) => c.id === id);

describe('CATEGORIES config integrity', () => {
  it('has 11 categories with unique ids', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
  });

  it('every field has a unique key within its category and a known type', () => {
    const types = new Set([
      'number', 'text', 'textarea', 'time', 'select', 'toggle', 'multi', 'meds', 'bmi', 'weather', 'habits',
    ]);
    for (const c of CATEGORIES) {
      const keys = c.fields.map((f) => f.key);
      expect(new Set(keys).size, `${c.id} keys unique`).toBe(keys.length);
      for (const f of c.fields) {
        expect(types.has(f.type), `${c.id}.${f.key} type`).toBe(true);
        if (['select', 'multi'].includes(f.type) && f.optionsKey !== 'pain') {
          expect(OPTIONS[f.optionsKey], `${c.id}.${f.key} options`).toBeInstanceOf(Array);
        }
      }
    }
  });

  it('explicit row layouts only reference real field keys', () => {
    for (const c of CATEGORIES) {
      if (!c.rows) continue;
      const keys = new Set(c.fields.map((f) => f.key));
      for (const row of c.rows) {
        for (const key of row) expect(keys.has(key), `${c.id} row key ${key}`).toBe(true);
      }
    }
  });
});

describe('defaultData', () => {
  it('creates an empty value of the right shape for every field', () => {
    const d = defaultData();
    expect(d.meals.breakfast).toBe('');
    expect(d.symptoms.triggers).toEqual([]);
    expect(d.medication.taken).toEqual({});
    expect(d.meals.skippedMeal).toBe(false);
  });
});

describe('fieldHasValue', () => {
  it('treats empty strings, false, [] and {} as no value', () => {
    expect(fieldHasValue({ type: 'text' }, '')).toBe(false);
    expect(fieldHasValue({ type: 'toggle' }, false)).toBe(false);
    expect(fieldHasValue({ type: 'multi' }, [])).toBe(false);
    expect(fieldHasValue({ type: 'meds' }, {})).toBe(false);
    expect(fieldHasValue({ type: 'bmi' }, '24')).toBe(false);
  });

  it('recognises entered values, including a pain level of 0', () => {
    expect(fieldHasValue({ type: 'select' }, '0')).toBe(true);
    expect(fieldHasValue({ type: 'toggle' }, true)).toBe(true);
    expect(fieldHasValue({ type: 'multi' }, ['stress'])).toBe(true);
    expect(fieldHasValue({ type: 'meds' }, { m1: true })).toBe(true);
  });
});

describe('categoryStatus', () => {
  it('counts only the filled fields', () => {
    const data = defaultData();
    expect(categoryStatus(data, cat('sleep'))).toEqual({ filled: false, count: 0 });
    data.sleep.sleepHours = '7';
    data.sleep.screenBeforeBed = true;
    expect(categoryStatus(data, cat('sleep'))).toEqual({ filled: true, count: 2 });
  });
});

describe('computeBmi', () => {
  it('computes to one decimal', () => {
    expect(computeBmi(80, 180)).toBe('24.7');
  });
  it('returns "" when an input is missing or zero', () => {
    expect(computeBmi('', 180)).toBe('');
    expect(computeBmi(80, 0)).toBe('');
    expect(computeBmi(undefined, undefined)).toBe('');
  });
});

describe('mergeData', () => {
  it('fills every field over defaults and keeps stored values', () => {
    const merged = mergeData({ meals: { breakfast: 'oats' }, unknown: { x: 1 } });
    expect(merged.meals.breakfast).toBe('oats');
    expect(merged.meals.lunch).toBe('');
    expect(merged.symptoms.triggers).toEqual([]);
    expect(merged.unknown).toBeUndefined();
  });

  it('handles null / non-object input', () => {
    expect(mergeData(null)).toEqual(defaultData());
    expect(mergeData('nope')).toEqual(defaultData());
  });
});

describe('deriveLegacyColumns', () => {
  it('pulls the four calendar columns out of the data document', () => {
    const data = defaultData();
    data.symptoms.painLevel = '6';
    data.sleep.sleepHours = '8';
    data.sleep.sleepQuality = 'good';
    data.sleep.sleepNote = '  woke up  ';
    expect(deriveLegacyColumns(data)).toEqual({
      painLevel: 6,
      sleepHours: 8,
      sleepQuality: 'good',
      sleepNote: 'woke up',
    });
  });

  it('nulls empty or invalid values', () => {
    const data = defaultData();
    data.sleep.sleepQuality = 'bogus';
    expect(deriveLegacyColumns(data)).toEqual({
      painLevel: null,
      sleepHours: null,
      sleepQuality: null,
      sleepNote: null,
    });
  });
});

describe('isFieldHidden', () => {
  it('matches a whole-category token or a field token', () => {
    expect(isFieldHidden(['meals'], 'meals', 'breakfast')).toBe(true);
    expect(isFieldHidden(['meals.caffeineCups'], 'meals', 'caffeineCups')).toBe(true);
    expect(isFieldHidden(['meals.caffeineCups'], 'meals', 'breakfast')).toBe(false);
  });
});

describe('visibleCategories', () => {
  it('returns all categories when nothing is hidden', () => {
    expect(visibleCategories([])).toHaveLength(CATEGORIES.length);
  });

  it('drops a hidden category entirely', () => {
    const ids = visibleCategories(['cycle']).map((c) => c.id);
    expect(ids).not.toContain('cycle');
  });

  it('removes a hidden field and prunes it from the row layout', () => {
    const meals = visibleCategories(['meals.caffeineCups']).find((c) => c.id === 'meals');
    expect(meals.fields.some((f) => f.key === 'caffeineCups')).toBe(false);
    for (const row of meals.rows) expect(row).not.toContain('caffeineCups');
    expect(meals.rows.every((r) => r.length > 0)).toBe(true);
  });

  it('drops a category once all its fields are hidden', () => {
    const hidden = cat('habits').fields.map((f) => `habits.${f.key}`);
    expect(visibleCategories(hidden).some((c) => c.id === 'habits')).toBe(false);
  });

  it('does not mutate the shared CATEGORIES config', () => {
    const before = cat('meals').fields.length;
    visibleCategories(['meals.caffeineCups']);
    expect(cat('meals').fields.length).toBe(before);
  });
});
