import { createAsyncThunk } from '@reduxjs/toolkit';

import { healthService } from './HealthService';

/** Keep the rejected payload a plain, serialisable object. */
function toErrorPayload(err) {
  return { message: err?.message || String(err || 'Unknown error') };
}

/** Load the current user's entry for a `YYYY-MM-DD` date (null if none). */
export const loadEntryForDate = createAsyncThunk(
  'health/loadEntryForDate',
  async (date, thunkApi) => {
    try {
      const entry = await healthService.getEntryByDate(date);
      return { date, entry };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);

/** Create or update the entry for `date`. */
export const saveEntryForDate = createAsyncThunk(
  'health/saveEntryForDate',
  async ({ date, values }, thunkApi) => {
    try {
      const entry = await healthService.saveEntry(date, values);
      return { date, entry };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);
