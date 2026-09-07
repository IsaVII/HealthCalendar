/** The only sanctioned way for the UI to read health state. */

export const selectHealthDate = (state) => state.health.date;
export const selectHealthEntry = (state) => state.health.entry;
export const selectHealthLoadStatus = (state) => state.health.loadStatus;
export const selectHealthSaving = (state) => state.health.saving;
export const selectHealthSavedAt = (state) => state.health.savedAt;
export const selectHealthError = (state) => state.health.error;

/** True once a real row exists for the day in view (vs. a blank form). */
export const selectHasEntry = (state) => Boolean(state.health.entry);
