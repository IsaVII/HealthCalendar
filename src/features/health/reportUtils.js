/**
 * Turns a span of daily entries into the compact summary the doctor report
 * renders. Pure: no i18n, no formatting — it returns raw keys and numbers and
 * the page translates them.
 */

import { parseIso } from './calendarUtils';

const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
const list = (v) => (Array.isArray(v) ? v : []);
const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Inclusive day count between two `YYYY-MM-DD` strings. */
export function daysBetween(from, to) {
  return Math.round((parseIso(to) - parseIso(from)) / 86_400_000) + 1;
}

/** `[['a','b'], ['a']]` → `[{ key:'a', count:2 }, { key:'b', count:1 }]`, desc. */
function tally(rows) {
  const counts = new Map();
  for (const keys of rows) for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));
}

/** Collapse a sorted date list into consecutive `{ from, to }` spans. */
function groupSpans(dates) {
  const sorted = [...new Set(dates)].sort();
  const spans = [];
  for (const d of sorted) {
    const last = spans.at(-1);
    if (last && daysBetween(last.to, d) === 2) last.to = d;
    else spans.push({ from: d, to: d });
  }
  return spans;
}

const clip = (s, max = 180) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/**
 * @param {{ entries: object[], from: string, to: string }} args
 * @returns compact per-section summary; a section is `null` when it has no data.
 */
export function buildReport({ entries = [], from, to }) {
  const rows = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const totalDays = from && to ? daysBetween(from, to) : rows.length;

  const painVals = [];
  let painHighDays = 0;
  const headache = [];
  const sleepHours = [];
  let poorNights = 0;
  const fluids = [];
  const caffeine = [];
  let exerciseDays = 0;
  let alcoholDays = 0;
  let alcoholUnits = 0;
  let painkillerDays = 0;
  const periodDates = [];
  const symptomRows = [];
  const triggerRows = [];
  const notes = [];

  for (const r of rows) {
    const d = r.data ?? {};
    const s = d.symptoms ?? {};
    const sl = d.sleep ?? {};
    const me = d.meals ?? {};
    const ac = d.activity ?? {};
    const cy = d.cycle ?? {};
    const md = d.medication ?? {};
    const il = d.illness ?? {};
    const mo = d.mood ?? {};

    const pain = num(s.painLevel) ?? num(r.pain_level);
    if (pain !== null) {
      painVals.push(pain);
      if (pain >= 4) painHighDays += 1;
    }

    const kinds = list(s.headacheKind);
    const intensity = num(s.headacheIntensity);
    if (kinds.length || intensity !== null || text(s.headacheStart)) {
      headache.push({
        date: r.entry_date,
        kinds,
        intensity,
        start: text(s.headacheStart),
        end: text(s.headacheEnd),
        relief: text(s.reliefTaken),
        worked: text(s.reliefWorked),
      });
    }

    const h = num(sl.sleepHours) ?? num(r.sleep_hours);
    if (h !== null) sleepHours.push(h);
    const quality = sl.sleepQuality ?? r.sleep_quality;
    if ((h !== null && h > 0 && h < 6) || quality === 'poor') poorNights += 1;

    const water = num(me.waterGlasses);
    if (water !== null) fluids.push(water);
    const cups = num(me.caffeineCups);
    if (cups !== null) caffeine.push(cups);

    if ((num(ac.exerciseMin) ?? 0) > 0 || (num(ac.steps) ?? 0) >= 5000) exerciseDays += 1;

    const units = num(me.alcoholUnits);
    if (units !== null && units > 0) {
      alcoholDays += 1;
      alcoholUnits += units;
    }

    if (md.painkillerToday === true) painkillerDays += 1;
    if (cy.periodActive === true) periodDates.push(r.entry_date);

    symptomRows.push(list(s.otherSymptoms));
    triggerRows.push(list(s.triggers));

    for (const [key, value] of [
      ['symptomNote', s.symptomNote],
      ['events', mo.events],
      ['appointments', il.appointments],
      ['injuries', il.injuries],
    ]) {
      const t = text(value);
      if (t) notes.push({ date: r.entry_date, key, text: clip(t) });
    }
  }

  return {
    range: { from, to, totalDays, daysLogged: rows.length },
    pain: painVals.length
      ? { avg: round1(mean(painVals)), max: Math.max(...painVals), highDays: painHighDays }
      : null,
    headache: headache.length
      ? {
          days: headache.length,
          byKind: tally(headache.map((e) => e.kinds)),
          avgIntensity: round1(mean(headache.map((e) => e.intensity).filter((x) => x !== null))),
          episodes: headache,
        }
      : null,
    sleep:
      sleepHours.length || poorNights
        ? { avgHours: round1(mean(sleepHours)), poorNights }
        : null,
    fluids: fluids.length ? { avgLitres: round1(mean(fluids)) } : null,
    caffeine: caffeine.some((x) => x > 0) ? { avgCups: round1(mean(caffeine)) } : null,
    exercise: exerciseDays ? { days: exerciseDays } : null,
    alcohol: alcoholDays ? { days: alcoholDays, totalUnits: round1(alcoholUnits) } : null,
    painkiller: painkillerDays ? { days: painkillerDays } : null,
    period: periodDates.length
      ? { days: periodDates.length, spans: groupSpans(periodDates) }
      : null,
    symptoms: tally(symptomRows).slice(0, 6),
    triggers: tally(triggerRows).slice(0, 6),
    notes,
  };
}
