/** The only sanctioned way for the UI to read health state. */

import { createSelector } from '@reduxjs/toolkit';

export const selectHealthDate = (state) => state.health.date;
export const selectHealthEntry = (state) => state.health.entry;
export const selectHealthPrevEntry = (state) => state.health.prevEntry;
export const selectHealthLoadStatus = (state) => state.health.loadStatus;
export const selectHealthSaving = (state) => state.health.saving;
export const selectHealthSavedAt = (state) => state.health.savedAt;
export const selectHealthError = (state) => state.health.error;

/** True once a real row exists for the day in view (vs. a blank form). */
export const selectHasEntry = (state) => Boolean(state.health.entry);

// --- calendar overview -----------------------------------------------------
export const selectCalendarView = (state) => state.health.calendarView;
export const selectCalendarCursor = (state) => state.health.calendarCursor;
export const selectEntriesByDate = (state) => state.health.entriesByDate;
export const selectRangeStatus = (state) => state.health.rangeStatus;
export const selectRangeError = (state) => state.health.rangeError;

// --- regular medications --------------------------------------------------
export const selectMedications = (state) => state.health.medications.items;
export const selectMedicationsStatus = (state) => state.health.medications.status;
export const selectMedicationsError = (state) => state.health.medications.error;
export const selectActiveMedications = createSelector(
  [selectMedications],
  (items) => items.filter((m) => m.is_active),
);
