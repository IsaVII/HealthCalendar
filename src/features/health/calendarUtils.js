/**
 * Pure date math for the calendar views. Everything is done in the browser's
 * local timezone and passed around as `YYYY-MM-DD` strings, so a day never
 * shifts under a UTC parse.
 */

/** The weekday the grid starts on: 1 = Monday. */
export const WEEK_STARTS_ON = 1;

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso, n) {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

export function addMonths(iso, n) {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export function addYears(iso, n) {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear() + n, d.getMonth(), 1));
}

/** First day of the month that `iso` falls in. */
export function startOfMonth(iso) {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function sameMonth(a, b) {
  return a.slice(0, 7) === b.slice(0, 7);
}

/**
 * The weeks that make up a month's grid. Each cell is `{ iso, inMonth }`.
 * Leading/trailing days from the adjacent months fill the first and last rows.
 */
export function monthMatrix(iso) {
  const d = parseIso(iso);
  const year = d.getFullYear();
  const month = d.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun
  const offset = (firstWeekday - WEEK_STARTS_ON + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((offset + daysInMonth) / 7);

  const weeks = [];
  for (let w = 0; w < weekCount; w += 1) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const dayNumber = w * 7 + i - offset + 1;
      const cell = new Date(year, month, dayNumber);
      week.push({ iso: toIso(cell), inMonth: cell.getMonth() === month });
    }
    weeks.push(week);
  }
  return weeks;
}

/** The 12 month-anchor dates (`YYYY-MM-01`) for a given year. */
export function monthsOfYear(iso) {
  const year = parseIso(iso).getFullYear();
  return Array.from({ length: 12 }, (_, m) => toIso(new Date(year, m, 1)));
}

/** Inclusive `{ from, to }` range covering the pixels a view will show. */
export function rangeForView(view, cursor) {
  if (view === 'year') {
    const year = parseIso(cursor).getFullYear();
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  const weeks = monthMatrix(cursor);
  return { from: weeks[0][0].iso, to: weeks[weeks.length - 1][6].iso };
}

/** Localised weekday labels, ordered from WEEK_STARTS_ON. */
export function weekdayLabels(locale, format = 'narrow') {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: format });
  // 2024-01-01 is a Monday, which matches WEEK_STARTS_ON = 1.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
}

export function monthLabel(locale, iso, opts = { month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(locale, opts).format(parseIso(iso));
}

/**
 * Pain level is bucketed two levels to a colour, green → red:
 * 0–1, 2–3, 4–5, 6–7, 8–9, 10. Classes are spelled out so Tailwind's JIT
 * keeps them.
 */
export const PAIN_BUCKETS = [
  { label: '0–1', className: 'bg-emerald-500' },
  { label: '2–3', className: 'bg-lime-500' },
  { label: '4–5', className: 'bg-yellow-400' },
  { label: '6–7', className: 'bg-amber-500' },
  { label: '8–9', className: 'bg-orange-600' },
  { label: '10', className: 'bg-red-700' },
];

/** The bucket index (0–5) a pain level falls in. */
export function painBucket(level) {
  return Math.floor(Math.max(0, Math.min(10, Math.round(level))) / 2);
}

/**
 * A Tailwind background class for a pain level 0–10, or a neutral class when the
 * day is logged without a pain value.
 */
export function painColor(level) {
  if (level === null || level === undefined) return 'bg-slate-400';
  return PAIN_BUCKETS[painBucket(level)].className;
}

// --- at-a-glance day indicators ------------------------------------------------

/** Menstrual flow, lightest → heaviest. Drives the period dot's size. */
export const FLOW_LEVELS = ['spotting', 'light', 'medium', 'heavy'];

/** Period-dot diameter in px per flow level. */
export const FLOW_DOT_PX = { spotting: 5, light: 7, medium: 9, heavy: 11 };

/** Mood 1–5 → a Tailwind background class, red (low) → green (high). */
export const MOOD_COLORS = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-400',
  4: 'bg-lime-500',
  5: 'bg-emerald-500',
};

/** Rose tint for a period day in the compact year grid, by flow level. */
export const FLOW_TINT = {
  spotting: 'bg-rose-200 dark:bg-rose-900',
  light: 'bg-rose-300 dark:bg-rose-800',
  medium: 'bg-rose-400 dark:bg-rose-700',
  heavy: 'bg-rose-500 dark:bg-rose-600',
};

/** Litres drunk → glass fill fraction 0–1 (half at 1 L, full at 2 L). */
export const waterFill = (litres) => Math.max(0, Math.min(1, Number(litres) / 2));

const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/**
 * Condense a calendar row into the handful of values the day cell draws.
 * `hidden` is the user's `hidden_health_fields` — an indicator whose category
 * or field is hidden is dropped so the grid matches what they track.
 *
 * Returns `null` for a day with nothing logged, otherwise:
 *   { pain, flow, waterL, mood, poorSleep, exercised }
 */
export function summariseEntry(entry, hidden = []) {
  if (!entry) return null;
  const data = entry.data ?? {};
  const shown = (cat, field) =>
    !hidden.includes(cat) && !hidden.includes(`${cat}.${field}`);

  const cycle = data.cycle ?? {};
  const meals = data.meals ?? {};
  const mood = data.mood ?? {};
  const sleep = data.sleep ?? {};
  const activity = data.activity ?? {};

  const flow =
    shown('cycle', 'flow') && cycle.periodActive
      ? FLOW_LEVELS.includes(cycle.flow)
        ? cycle.flow
        : 'light'
      : null;

  const waterL = shown('meals', 'waterGlasses') ? toNum(meals.waterGlasses) : null;
  const moodLevel = shown('mood', 'mood') ? toNum(mood.mood) : null;

  const sleepHours = toNum(entry.sleep_hours ?? sleep.sleepHours);
  const sleepQuality = entry.sleep_quality ?? sleep.sleepQuality;
  const poorSleep =
    !hidden.includes('sleep') &&
    ((sleepHours !== null && sleepHours > 0 && sleepHours < 6) || sleepQuality === 'poor');

  const exercised =
    !hidden.includes('activity') &&
    ((toNum(activity.exerciseMin) ?? 0) > 0 || (toNum(activity.steps) ?? 0) >= 5000);

  return {
    pain: entry.pain_level ?? null,
    flow,
    waterL: waterL !== null && waterL > 0 ? waterL : null,
    mood: moodLevel !== null && moodLevel >= 1 ? Math.round(moodLevel) : null,
    poorSleep,
    exercised,
  };
}
