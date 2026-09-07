import { describe, it, expect } from 'vitest';

import {
  todayIso,
  isIsoDate,
  entryToForm,
  formToValues,
  PAIN_LEVELS,
  SLEEP_QUALITY_VALUES,
} from './healthConstants';
import { defaultData } from './healthSchema';

describe('todayIso', () => {
  it('is a YYYY-MM-DD string for the local day', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = new Date();
    expect(todayIso()).toBe(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`,
    );
  });
});

describe('isIsoDate', () => {
  it('accepts real calendar days', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true); // leap year
  });
  it('rejects malformed strings and impossible dates', () => {
    expect(isIsoDate('2026-2-1')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate(20260101)).toBe(false);
  });
});

describe('constants', () => {
  it('PAIN_LEVELS is 0..10 and SLEEP_QUALITY_VALUES is ascending', () => {
    expect(PAIN_LEVELS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(SLEEP_QUALITY_VALUES).toEqual(['poor', 'fair', 'good', 'excellent']);
  });
});

describe('entryToForm / formToValues', () => {
  it('entryToForm always yields a complete data document', () => {
    expect(entryToForm(null)).toEqual({ data: defaultData() });
    expect(entryToForm({ data: { meals: { breakfast: 'oats' } } }).data.meals.breakfast).toBe(
      'oats',
    );
  });

  it('formToValues emits the legacy columns plus the data document', () => {
    const form = entryToForm(null);
    form.data.symptoms.painLevel = '5';
    form.data.sleep.sleepHours = '7';
    const values = formToValues(form);
    expect(values.painLevel).toBe(5);
    expect(values.sleepHours).toBe(7);
    expect(values.data).toBe(form.data);
  });

  it('round-trips through a saved row', () => {
    const form = entryToForm(null);
    form.data.meals.lunch = 'salad';
    const saved = { data: formToValues(form).data };
    expect(entryToForm(saved).data.meals.lunch).toBe('salad');
  });
});
