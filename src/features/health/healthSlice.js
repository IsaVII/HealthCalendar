import { createSlice } from '@reduxjs/toolkit';

import { loadEntryForDate, saveEntryForDate } from './healthThunks';

/**
 * One day in view at a time.
 *
 * loadStatus:
 *   'idle'    – nothing requested yet
 *   'loading' – fetching the entry for `date`
 *   'ready'   – `entry` reflects the server (it may be null: nothing logged)
 *   'error'   – the fetch failed; see `error`
 */
const initialState = {
  date: null,
  entry: null,
  loadStatus: 'idle',
  saving: false,
  savedAt: null, // timestamp of the last successful save, for a transient notice
  error: null, // { message } from the last failed load or save
};

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
      })
      .addCase(saveEntryForDate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? { message: 'Error' };
      });
  },
});

export { loadEntryForDate, saveEntryForDate };
export const { clearHealthError, clearSavedFlag } = healthSlice.actions;
export default healthSlice.reducer;
