import { describe, it, expect } from 'vitest';

import { buildReport, daysBetween } from './reportUtils';

const row = (date, data, cols = {}) => ({ entry_date: date, data, ...cols });

describe('daysBetween', () => {
  it('is inclusive', () => {
    expect(daysBetween('2026-06-01', '2026-06-01')).toBe(1);
    expect(daysBetween('2026-06-01', '2026-06-30')).toBe(30);
  });
});

describe('buildReport', () => {
  const from = '2026-06-01';
  const to = '2026-06-10';

  it('reports coverage and an empty shape with no entries', () => {
    const r = buildReport({ entries: [], from, to });
    expect(r.range).toEqual({ from, to, totalDays: 10, daysLogged: 0 });
    expect(r.pain).toBeNull();
    expect(r.headache).toBeNull();
  });

  it('summarises pain, sleep, fluids and exercise', () => {
    const r = buildReport({
      entries: [
        row('2026-06-01', { symptoms: { painLevel: '6' }, meals: { waterGlasses: '2' } }, { sleep_hours: 5 }),
        row('2026-06-02', { symptoms: { painLevel: '2' }, activity: { exerciseMin: '40' } }, { sleep_hours: 8 }),
      ],
      from,
      to,
    });
    expect(r.range.daysLogged).toBe(2);
    expect(r.pain).toEqual({ avg: 4, max: 6, highDays: 1 });
    expect(r.sleep).toEqual({ avgHours: 6.5, poorNights: 1 });
    expect(r.fluids).toEqual({ avgLitres: 2 });
    expect(r.exercise).toEqual({ days: 1 });
  });

  it('builds a headache log with a kind breakdown and average intensity', () => {
    const r = buildReport({
      entries: [
        row('2026-06-03', {
          symptoms: {
            headacheKind: ['migraine'],
            headacheIntensity: '8',
            headacheStart: '09:00',
            headacheEnd: '13:00',
            reliefTaken: 'Sumatriptan',
            reliefWorked: 'partly',
          },
        }),
        row('2026-06-05', { symptoms: { headacheKind: ['tension'], headacheIntensity: '4' } }),
      ],
      from,
      to,
    });
    expect(r.headache.days).toBe(2);
    expect(r.headache.avgIntensity).toBe(6);
    expect(r.headache.byKind).toEqual([
      { key: 'migraine', count: 1 },
      { key: 'tension', count: 1 },
    ]);
    expect(r.headache.episodes[0]).toMatchObject({ date: '2026-06-03', start: '09:00', worked: 'partly' });
  });

  it('groups period days into consecutive spans', () => {
    const r = buildReport({
      entries: [
        row('2026-06-01', { cycle: { periodActive: true } }),
        row('2026-06-02', { cycle: { periodActive: true } }),
        row('2026-06-03', { cycle: { periodActive: true } }),
        row('2026-06-08', { cycle: { periodActive: true } }),
      ],
      from,
      to,
    });
    expect(r.period.days).toBe(4);
    expect(r.period.spans).toEqual([
      { from: '2026-06-01', to: '2026-06-03' },
      { from: '2026-06-08', to: '2026-06-08' },
    ]);
  });

  it('tallies symptoms and triggers, most frequent first', () => {
    const r = buildReport({
      entries: [
        row('2026-06-01', { symptoms: { otherSymptoms: ['fatigue', 'nausea'], triggers: ['stress'] } }),
        row('2026-06-02', { symptoms: { otherSymptoms: ['fatigue'], triggers: ['stress', 'poor_sleep'] } }),
      ],
      from,
      to,
    });
    expect(r.symptoms[0]).toEqual({ key: 'fatigue', count: 2 });
    expect(r.triggers[0]).toEqual({ key: 'stress', count: 2 });
  });

  it('collects dated notes and clips long text', () => {
    const long = 'x'.repeat(300);
    const r = buildReport({
      entries: [row('2026-06-04', { symptoms: { symptomNote: long }, mood: { events: 'trip' } })],
      from,
      to,
    });
    expect(r.notes).toHaveLength(2);
    expect(r.notes[0]).toMatchObject({ date: '2026-06-04', key: 'symptomNote' });
    expect(r.notes[0].text.length).toBeLessThanOrEqual(180);
    expect(r.notes[1]).toEqual({ date: '2026-06-04', key: 'events', text: 'trip' });
  });
});
