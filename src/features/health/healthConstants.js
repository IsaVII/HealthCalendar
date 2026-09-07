/**
 * Shared shapes for the health feature. Mirrors the CHECK constraints in
 * migration 0002 so the client and database agree.
 */

import { mergeData, deriveLegacyColumns } from './healthSchema';

/** Allowed `sleep_quality` values, in ascending order. */
export const SLEEP_QUALITY_VALUES = ['poor', 'fair', 'good', 'excellent'];

export const PAIN_LEVEL_MIN = 0;
export const PAIN_LEVEL_MAX = 10;

/** Selectable pain levels, [0, 1, …, 10]. */
export const PAIN_LEVELS = Array.from(
  { length: PAIN_LEVEL_MAX - PAIN_LEVEL_MIN + 1 },
  (_, i) => PAIN_LEVEL_MIN + i,
);

export const SLEEP_HOURS_MIN = 0;
export const SLEEP_HOURS_MAX = 24;

/** Today's date as a `YYYY-MM-DD` string in the browser's local timezone. */
export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** True for a well-formed `YYYY-MM-DD` string that names a real calendar day. */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

/** DB row -> form state: `{ data }`, with every schema field present. */
export function entryToForm(entry) {
  return { data: mergeData(entry?.data) };
}

/**
 * Form state (`{ data }`) -> the values the service upserts: the flexible
 * `data` document plus the four legacy columns the calendar reads.
 */
export function formToValues(form) {
  return { ...deriveLegacyColumns(form.data), data: form.data };
}
