import { createAsyncThunk } from '@reduxjs/toolkit';

import { medicationService } from './MedicationService';

/** Keep the rejected payload a plain, serialisable object. */
function toErrorPayload(err) {
  return { message: err?.message || String(err || 'Unknown error') };
}

export const loadMedications = createAsyncThunk(
  'health/loadMedications',
  async (_, thunkApi) => {
    try {
      return { items: await medicationService.listMedications() };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);

export const addMedication = createAsyncThunk(
  'health/addMedication',
  async (values, thunkApi) => {
    try {
      return { item: await medicationService.createMedication(values) };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);

export const updateMedication = createAsyncThunk(
  'health/updateMedication',
  async ({ id, patch }, thunkApi) => {
    try {
      return { item: await medicationService.updateMedication(id, patch) };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);

export const removeMedication = createAsyncThunk(
  'health/removeMedication',
  async (id, thunkApi) => {
    try {
      await medicationService.deleteMedication(id);
      return { id };
    } catch (err) {
      return thunkApi.rejectWithValue(toErrorPayload(err));
    }
  },
);
