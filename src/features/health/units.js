/**
 * Measurement-system conversions for the daily entry form.
 *
 * Everything is stored canonically in metric inside `health_entries.data`
 * (kg, cm, °C, mmol/L, litres). A profile's `unit_system` only changes how a
 * field is entered and displayed — the value written back is always metric.
 *
 * A schema field opts in with `convert: '<kind>'`; each kind lists, per system,
 * the unit label, the input `step`, and the pair of pure functions that move a
 * number between the stored (metric) value and the shown value.
 */

export const UNIT_SYSTEMS = ['metric', 'imperial'];

export const DEFAULT_UNIT_SYSTEM = 'metric';

const LB_PER_KG = 1 / 0.45359237;
const IN_PER_CM = 1 / 2.54;
const MGDL_PER_MMOL = 18.0182; // glucose
const FLOZ_PER_L = 33.814; // US fluid ounces

const identity = (v) => v;

export const CONVERTERS = {
  weight: {
    metric: { unit: 'kg', step: 0.1, toDisplay: identity, toStored: identity },
    imperial: {
      unit: 'lb',
      step: 0.1,
      toDisplay: (v) => v * LB_PER_KG,
      toStored: (v) => v / LB_PER_KG,
    },
  },
  length: {
    metric: { unit: 'cm', step: 0.5, toDisplay: identity, toStored: identity },
    imperial: {
      unit: 'in',
      step: 0.25,
      toDisplay: (v) => v * IN_PER_CM,
      toStored: (v) => v / IN_PER_CM,
    },
  },
  temperature: {
    metric: { unit: '°C', step: 0.1, toDisplay: identity, toStored: identity },
    imperial: {
      unit: '°F',
      step: 0.1,
      toDisplay: (v) => v * 1.8 + 32,
      toStored: (v) => (v - 32) / 1.8,
    },
  },
  glucose: {
    metric: { unit: 'mmol/L', step: 0.1, toDisplay: identity, toStored: identity },
    imperial: {
      unit: 'mg/dL',
      step: 1,
      toDisplay: (v) => v * MGDL_PER_MMOL,
      toStored: (v) => v / MGDL_PER_MMOL,
    },
  },
  volume: {
    metric: { unit: 'L', step: 0.1, toDisplay: identity, toStored: identity },
    imperial: {
      unit: 'fl oz',
      step: 1,
      toDisplay: (v) => v * FLOZ_PER_L,
      toStored: (v) => v / FLOZ_PER_L,
    },
  },
};

/** The active {unit, step, toDisplay, toStored} for a field kind + system. */
export function unitConfig(convert, system = DEFAULT_UNIT_SYSTEM) {
  const kind = CONVERTERS[convert];
  if (!kind) return null;
  return kind[system] ?? kind[DEFAULT_UNIT_SYSTEM];
}

const round = (n, dp) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Stored (metric) string -> the string to show in the input for `system`. */
export function toDisplayValue(convert, system, stored, dp = 2) {
  if (stored === '' || stored === null || stored === undefined) return '';
  const n = Number(stored);
  if (!Number.isFinite(n)) return String(stored);
  const cfg = unitConfig(convert, system);
  if (!cfg) return String(stored);
  return String(round(cfg.toDisplay(n), dp));
}

/** Input string in `system` units -> the metric string to store. */
export function toStoredValue(convert, system, display, dp = 4) {
  if (display === '' || display === null || display === undefined) return '';
  const n = Number(display);
  if (!Number.isFinite(n)) return '';
  const cfg = unitConfig(convert, system);
  if (!cfg) return String(display);
  return String(round(cfg.toStored(n), dp));
}

/** Convert a metric bound (min/max) into the shown system, or `undefined`. */
export function toDisplayBound(convert, system, bound) {
  if (bound === undefined || bound === null) return undefined;
  const cfg = unitConfig(convert, system);
  if (!cfg) return bound;
  return round(cfg.toDisplay(Number(bound)), 2);
}
