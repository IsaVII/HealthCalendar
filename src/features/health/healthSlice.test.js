import { describe, it, expect } from 'vitest';

import reducer, {
  loadEntryForDate,
  saveEntryForDate,
  loadEntriesInRange,
  loadMedications,
  addMedication,
  updateMedication,
  removeMedication,
} from './healthSlice';

const initial = reducer(undefined, { type: '@@INIT' });

describe('loadEntryForDate', () => {
  it('pending records the date and clears prior state', () => {
    const s = reducer(initial, loadEntryForDate.pending('rid', '2026-01-02'));
    expect(s.date).toBe('2026-01-02');
    expect(s.loadStatus).toBe('loading');
  });

  it('fulfilled stores the entry for the current date', () => {
    let s = reducer(initial, loadEntryForDate.pending('rid', '2026-01-02'));
    s = reducer(
      s,
      loadEntryForDate.fulfilled({ date: '2026-01-02', entry: { id: 'e1' } }, 'rid', '2026-01-02'),
    );
    expect(s.entry).toEqual({ id: 'e1' });
    expect(s.loadStatus).toBe('ready');
  });

  it('fulfilled ignores a stale response for another date', () => {
    let s = reducer(initial, loadEntryForDate.pending('rid', '2026-02-02'));
    s = reducer(
      s,
      loadEntryForDate.fulfilled({ date: '2026-01-02', entry: { id: 'old' } }, 'rid', '2026-01-02'),
    );
    expect(s.entry).toBeNull();
  });

  it('rejected surfaces the error payload', () => {
    const s = reducer(
      initial,
      loadEntryForDate.rejected(null, 'rid', '2026-01-02', { message: 'boom' }),
    );
    expect(s.loadStatus).toBe('error');
    expect(s.error).toEqual({ message: 'boom' });
  });
});

describe('saveEntryForDate', () => {
  it('fulfilled updates the open entry and the calendar cache', () => {
    let s = reducer(initial, loadEntryForDate.pending('r', '2026-01-02'));
    s = reducer(
      s,
      saveEntryForDate.fulfilled(
        { date: '2026-01-02', entry: { id: 'e1', pain_level: 3 } },
        'r',
        { date: '2026-01-02', values: {} },
      ),
    );
    expect(s.saving).toBe(false);
    expect(s.savedAt).toEqual(expect.any(Number));
    expect(s.entry).toEqual({ id: 'e1', pain_level: 3 });
    expect(s.entriesByDate['2026-01-02']).toEqual({ id: 'e1', pain_level: 3 });
  });

  it('rejected clears saving and keeps the error', () => {
    const s = reducer(
      { ...initial, saving: true },
      saveEntryForDate.rejected(null, 'r', {}, { message: 'no' }),
    );
    expect(s.saving).toBe(false);
    expect(s.error).toEqual({ message: 'no' });
  });
});

describe('loadEntriesInRange', () => {
  it('fulfilled indexes rows by date', () => {
    const s = reducer(
      initial,
      loadEntriesInRange.fulfilled(
        { from: 'a', to: 'b', entries: [{ entry_date: '2026-01-02', pain_level: 1 }] },
        'r',
        {},
      ),
    );
    expect(s.entriesByDate).toEqual({ '2026-01-02': { entry_date: '2026-01-02', pain_level: 1 } });
    expect(s.rangeStatus).toBe('ready');
  });
});

describe('medications sub-state', () => {
  it('loads, adds, updates and removes', () => {
    let s = reducer(initial, loadMedications.fulfilled({ items: [{ id: 'm1', is_active: true }] }));
    expect(s.medications.items).toHaveLength(1);
    expect(s.medications.status).toBe('ready');

    s = reducer(s, addMedication.fulfilled({ item: { id: 'm2', is_active: true } }));
    expect(s.medications.items.map((m) => m.id)).toEqual(['m1', 'm2']);

    s = reducer(s, updateMedication.fulfilled({ item: { id: 'm1', is_active: false } }));
    expect(s.medications.items.find((m) => m.id === 'm1').is_active).toBe(false);

    s = reducer(s, removeMedication.fulfilled({ id: 'm2' }));
    expect(s.medications.items.map((m) => m.id)).toEqual(['m1']);
  });

  it('records a load error', () => {
    const s = reducer(initial, loadMedications.rejected(null, 'r', undefined, { message: 'x' }));
    expect(s.medications.status).toBe('error');
    expect(s.medications.error).toEqual({ message: 'x' });
  });
});
