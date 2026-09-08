import { createSlice } from '@reduxjs/toolkit';

import {
  loadEntryForDate,
  loadEntryBefore,
  saveEntryForDate,
  loadEntriesInRange,
} from './healthThunks';
import {
  loadMedications,
  addMedication,
  updateMedication,
  removeMedication,
} from './medicationThunks';
import { todayIso } from './healthConstants';

/**
 * Two concerns in one slice:
 *
 *  - the single day open in the entry form (`date`, `entry`, `loadStatus`, …)
 *  - the calendar overview (`calendarView`, `calendarCursor`, `entriesByDate`)
 *
 * loadStatus:
 *   'idle'    – nothing requested yet
 *   'loading' – fetching the entry for `date`
 *   'ready'   – `entry` reflects the server (it may be null: nothing logged)
 *   'error'   – the fetch failed; see `error`
 */
const initialState = {
  // --- entry form ---------------------------------------------------------
  date: null,
  entry: null,
  prevEntry: null, // most recent entry before `date`, for "same as yesterday" prefills
  loadStatus: 'idle',
  saving: false,
  savedAt: null, // timestamp of the last successful save, for a transient notice
  error: null, // { message } from the last failed load or save

  // --- calendar overview -------------------------------------------------
  calendarView: 'month', // 'month' | 'year'
  calendarCursor: todayIso(), // any day inside the period in view
  entriesByDate: {}, // 'YYYY-MM-DD' -> { pain_level, sleep_hours, sleep_quality }
  rangeStatus: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  rangeError: null,

  // --- regular medications (managed in Settings) -----------------------
  medications: { items: [], status: 'idle', error: null },
};

function indexByDate(entries) {
  const map = {};
  for (const row of entries) map[row.entry_date] = row;
  return map;
}

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearHealthError(state) {
      state.error = null;
    },
    clearSavedFlag(state) {
      state.savedAt = null;
    },
    setCalendarView(state, action) {
      state.calendarView = action.payload;
    },
    setCalendarCursor(state, action) {
      state.calendarCursor = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadEntryForDate.pending, (state, action) => {
        state.date = action.meta.arg;
        state.loadStatus = 'loading';
        state.error = null;
        state.savedAt = null;
      })
      .addCase(loadEntryForDate.fulfilled, (state, action) => {
        // Ignore a stale response if the user has moved to another date.
        if (action.payload.date !== state.date) return;
        state.entry = action.payload.entry;
        state.loadStatus = 'ready';
      })
      .addCase(loadEntryBefore.pending, (state) => {
        state.prevEntry = null;
      })
      .addCase(loadEntryBefore.fulfilled, (state, action) => {
        if (action.payload.date !== state.date) return;
        state.prevEntry = action.payload.entry;
      })
      .addCase(loadEntryForDate.rejected, (state, action) => {
        state.loadStatus = 'error';
        state.error = action.payload ?? { message: 'Error' };
      })
      .addCase(saveEntryForDate.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.savedAt = null;
      })
      .addCase(saveEntryForDate.fulfilled, (state, action) => {
        state.saving = false;
        state.savedAt = Date.now();
        if (action.payload.date === state.date) {
          state.entry = action.payload.entry;
        }
        // Keep any calendar view already in memory consistent.
        state.entriesByDate[action.payload.date] = action.payload.entry;
      })
      .addCase(saveEntryForDate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? { message: 'Error' };
      })
      .addCase(loadEntriesInRange.pending, (state) => {
        state.rangeStatus = 'loading';
        state.rangeError = null;
      })
      .addCase(loadEntriesInRange.fulfilled, (state, action) => {
        state.entriesByDate = indexByDate(action.payload.entries);
        state.rangeStatus = 'ready';
      })
      .addCase(loadEntriesInRange.rejected, (state, action) => {
        state.rangeStatus = 'error';
        state.rangeError = action.payload ?? { message: 'Error' };
      })
      .addCase(loadMedications.pending, (state) => {
        state.medications.status = 'loading';
        state.medications.error = null;
      })
      .addCase(loadMedications.fulfilled, (state, action) => {
        state.medications.status = 'ready';
        state.medications.items = action.payload.items;
      })
      .addCase(loadMedications.rejected, (state, action) => {
        state.medications.status = 'error';
        state.medications.error = action.payload ?? { message: 'Error' };
      })
      .addCase(addMedication.fulfilled, (state, action) => {
        state.medications.items.push(action.payload.item);
      })
      .addCase(updateMedication.fulfilled, (state, action) => {
        const i = state.medications.items.findIndex((m) => m.id === action.payload.item.id);
        if (i !== -1) state.medications.items[i] = action.payload.item;
      })
      .addCase(removeMedication.fulfilled, (state, action) => {
        state.medications.items = state.medications.items.filter(
          (m) => m.id !== action.payload.id,
        );
      });
  },
});

export { loadEntryForDate, loadEntryBefore, saveEntryForDate, loadEntriesInRange };
export { loadMedications, addMedication, updateMedication, removeMedication };
export const { clearHealthError, clearSavedFlag, setCalendarView, setCalendarCursor } =
  healthSlice.actions;
export default healthSlice.reducer;
