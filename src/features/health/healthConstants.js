/**
 * Shared shapes for the health feature. Mirrors the CHECK constraints in
 * migration 0002 so the client and database agree.
 */

/** Allowed `sleep_quality` values, in ascending order. */
export const SLEEP_QUALITY_VALUES = ['poor', 'fair', 'good', 'excellent'];

export const PAIN_LEVEL_MIN = 0;
export const PAIN_LEVEL_MAX = 10;

export const SLEEP_HOURS_MIN = 0;
export const SLEEP_HOURS_MAX = 24;

/** Today's date as a `YYYY-MM-DD` string in the browser's local timezone. */
export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** DB row -> form state (all fields are strings the inputs can bind to). */
export function entryToForm(entry) {
  return {
    painLevel: entry?.pain_level ?? '',
    sleepHours: entry?.sleep_hours ?? '',
    sleepQuality: entry?.sleep_quality ?? '',
  };
}

/** Form state -> the values a thunk/service expects (numbers or null). */
export function formToValues(form) {
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  return {
    painLevel: num(form.painLevel),
    sleepHours: num(form.sleepHours),
    sleepQuality: form.sleepQuality || null,
  };
}
