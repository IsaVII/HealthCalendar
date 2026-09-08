import { createAsyncThunk } from '@reduxjs/toolkit';

import { habitService } from './HabitService';

/** Keep the rejected payload a plain, serialisable object. */
function toErrorPayload(err) {
  return { message: err?.message || String(err || 'Unknown error') };
}

export const loadHabits = createAsyncThunk('health/loadHabits', async (_, thunkApi) => {
  try {
    return { items: await habitService.listHabits() };
  } catch (err) {
    return thunkApi.rejectWithValue(toErrorPayload(err));
  }
});

export const addHabit = createAsyncThunk('health/addHabit', async (values, thunkApi) => {
  try {
    return { item: await habitService.createHabit(values) };
  } catch (err) {
    return thunkApi.rejectWithValue(toErrorPayload(err));
  }
});

export const updateHabit = createAsyncThunk(
  'health/updateHabit',
  async ({ id, patch }, thunkApi) => {
    try {
      return { item: await habitService.updateHabit(id, patch) };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);

export const removeHabit = createAsyncThunk('health/removeHabit', async (id, thunkApi) => {
  try {
    await habitService.deleteHabit(id);
    return { id };
  } catch (err) {
    return thunkApi.rejectWithValue(toErrorPayload(err));
  }
});
