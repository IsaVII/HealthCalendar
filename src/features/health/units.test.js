import { describe, it, expect } from 'vitest';

import {
  UNIT_SYSTEMS,
  unitConfig,
  toDisplayValue,
  toStoredValue,
  toDisplayBound,
} from './units';

describe('units', () => {
  it('exposes the two supported systems', () => {
    expect(UNIT_SYSTEMS).toEqual(['metric', 'imperial']);
  });

  it('metric is a pass-through for every kind', () => {
    for (const kind of ['weight', 'length', 'temperature', 'glucose', 'volume']) {
      expect(toDisplayValue(kind, 'metric', '12.3')).toBe('12.3');
      expect(toStoredValue(kind, 'metric', '12.3')).toBe('12.3');
    }
  });

  it('converts weight kg <-> lb and round-trips', () => {
    expect(Number(toDisplayValue('weight', 'imperial', '100'))).toBeCloseTo(220.46, 1);
    expect(Number(toStoredValue('weight', 'imperial', '220.46'))).toBeCloseTo(100, 2);
  });

  it('converts temperature C <-> F', () => {
    expect(toDisplayValue('temperature', 'imperial', '37')).toBe('98.6');
    expect(Number(toStoredValue('temperature', 'imperial', '98.6'))).toBeCloseTo(37, 4);
  });

  it('converts litres <-> US fluid ounces', () => {
    expect(Number(toDisplayValue('volume', 'imperial', '1'))).toBeCloseTo(33.81, 1);
  });

  it('blank and non-numeric input stay blank', () => {
    expect(toDisplayValue('weight', 'imperial', '')).toBe('');
    expect(toStoredValue('weight', 'imperial', '')).toBe('');
    expect(toStoredValue('weight', 'imperial', 'abc')).toBe('');
  });

  it('unitConfig gives the label + step for the active system', () => {
    expect(unitConfig('length', 'metric').unit).toBe('cm');
    expect(unitConfig('length', 'imperial').unit).toBe('in');
    expect(unitConfig('length', 'imperial').step).toBe(0.25);
  });

  it('converts min/max bounds into the shown system', () => {
    expect(toDisplayBound('length', 'imperial', 30)).toBeCloseTo(11.81, 2);
    expect(toDisplayBound('weight', 'metric', 400)).toBe(400);
    expect(toDisplayBound('weight', 'imperial', undefined)).toBeUndefined();
  });
});
