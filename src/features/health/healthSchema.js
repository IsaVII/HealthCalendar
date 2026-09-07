/**
 * The shape of a day's health `data` jsonb, as a flat config the entry form
 * renders from and the helpers below read back. One entry in `CATEGORIES` is
 * one collapsible card on the page.
 *
 * Field types:
 *   number   – numeric input (min/max/step/unit)
 *   text     – single-line text
 *   textarea – short free text
 *   time     – HH:MM
 *   select   – one value from `optionsKey`
 *   toggle   – boolean
 *   multi    – any number of values from `optionsKey` (stored as string[])
 *   meds     – the user's active medications as a checklist (stored as
 *              { [medicationId]: "HH:MM" | true })
 *   bmi      – read-only, derived from body.weightKg + body.heightCm
 *
 * `labelKey` / option labels resolve against i18n:
 *   field label  -> health.fields.<key>
 *   option label -> health.options.<optionsKey>.<value>
 *   card title   -> health.categories.<id>
 */

export const OPTIONS = {
  portion: ['light', 'normal', 'large'],
  sugar: ['none', 'some', 'a_lot'],
  intensity: ['low', 'moderate', 'high'],
  postExercise: ['energized', 'normal', 'tired', 'sore'],
  sleepQuality: ['poor', 'fair', 'good', 'excellent'],
  scale5: ['1', '2', '3', '4', '5'],
  reliefWorked: ['yes', 'partly', 'no'],
  headacheKind: ['migraine', 'tension', 'cluster', 'sinus', 'cervicogenic', 'other'],
  headacheLocation: ['frontal', 'temporal', 'occipital', 'one_sided', 'behind_eye'],
  headacheType: ['throbbing', 'pressure', 'stabbing', 'dull'],
  headacheAssociated: ['nausea', 'aura', 'light_sensitivity', 'sound_sensitivity', 'tearing'],
  otherSymptoms: [
    'nausea', 'dizziness', 'fatigue', 'bloating', 'cramps',
    'joint_pain', 'back_pain', 'congestion', 'skin_issue',
  ],
  triggers: [
    'dehydration', 'skipped_meal', 'poor_sleep', 'oversleeping', 'stress',
    'alcohol', 'red_wine', 'aged_cheese', 'chocolate', 'caffeine_excess',
    'caffeine_withdrawal', 'processed_food', 'screen_strain', 'bright_light',
    'loud_noise', 'strong_smell', 'weather_change', 'menstruation',
    'physical_exertion', 'posture', 'illness', 'new_medication',
  ],
  flow: ['spotting', 'light', 'medium', 'heavy'],
  pms: ['cramps', 'mood_swings', 'cravings', 'headache', 'bloating', 'tender_breasts'],
  pressure: ['drop', 'stable', 'rise'],
  airQuality: ['good', 'moderate', 'poor'],
  posture: ['good', 'mixed', 'poor'],
  habits: [
    'smoking', 'alcohol', 'caffeine_after_2pm', 'screen_before_bed',
    'outdoor_time', 'daylight', 'meditation', 'exercise',
  ],
};

export const CATEGORIES = [
  {
    id: 'meals',
    icon: '🍽️',
    // Explicit row layout so each meal sits on its own line instead of the
    // fields flowing into a mixed grid.
    rows: [
      ['breakfastTime', 'breakfast'],
      ['lunchTime', 'lunch'],
      ['dinnerTime', 'dinner'],
      ['snacks'],
      ['portion', 'lastFoodTime', 'skippedMeal'],
      ['waterGlasses', 'caffeineCups', 'caffeineLastTime'],
      ['alcoholUnits', 'sugar'],
      ['supplements'],
    ],
    fields: [
      { key: 'breakfastTime', type: 'time' },
      { key: 'breakfast', type: 'text' },
      { key: 'lunchTime', type: 'time' },
      { key: 'lunch', type: 'text' },
      { key: 'dinnerTime', type: 'time' },
      { key: 'dinner', type: 'text' },
      { key: 'snacks', type: 'text' },
      { key: 'portion', type: 'select', optionsKey: 'portion' },
      { key: 'lastFoodTime', type: 'time' },
      { key: 'skippedMeal', type: 'toggle' },
      { key: 'waterGlasses', type: 'number', min: 0, max: 30, step: 1 },
      { key: 'caffeineCups', type: 'number', min: 0, max: 20, step: 1 },
      { key: 'caffeineLastTime', type: 'time' },
      { key: 'alcoholUnits', type: 'number', min: 0, max: 30, step: 1 },
      { key: 'sugar', type: 'select', optionsKey: 'sugar' },
      { key: 'supplements', type: 'text' },
    ],
  },
  {
    id: 'body',
    icon: '⚖️',
    fields: [
      { key: 'weightKg', type: 'number', min: 20, max: 400, step: 0.1, unit: 'kg' },
      { key: 'heightCm', type: 'number', min: 30, max: 260, step: 0.5, unit: 'cm' },
      { key: 'bmi', type: 'bmi' },
      { key: 'waistCm', type: 'number', min: 30, max: 250, step: 0.5, unit: 'cm' },
      { key: 'bodyFatPct', type: 'number', min: 1, max: 70, step: 0.1, unit: '%' },
      { key: 'systolic', type: 'number', min: 60, max: 260, step: 1 },
      { key: 'diastolic', type: 'number', min: 30, max: 180, step: 1 },
      { key: 'restingHr', type: 'number', min: 30, max: 220, step: 1, unit: 'bpm' },
      { key: 'temperatureC', type: 'number', min: 33, max: 43, step: 0.1, unit: '°C' },
      { key: 'bloodGlucose', type: 'number', min: 1, max: 40, step: 0.1 },
    ],
  },
  {
    id: 'sleep',
    icon: '😴',
    fields: [
      { key: 'bedtime', type: 'time' },
      { key: 'wakeTime', type: 'time' },
      { key: 'sleepHours', type: 'number', min: 0, max: 24, step: 0.5, unit: 'h' },
      { key: 'sleepQuality', type: 'select', optionsKey: 'sleepQuality' },
      { key: 'awakenings', type: 'number', min: 0, max: 30, step: 1 },
      { key: 'sleepLatencyMin', type: 'number', min: 0, max: 300, step: 5, unit: 'min' },
      { key: 'napMin', type: 'number', min: 0, max: 600, step: 5, unit: 'min' },
      { key: 'screenBeforeBed', type: 'toggle' },
      { key: 'sleepNote', type: 'textarea', maxLength: 500 },
    ],
  },
  {
    id: 'activity',
    icon: '🏃',
    fields: [
      { key: 'exerciseType', type: 'text' },
      { key: 'exerciseMin', type: 'number', min: 0, max: 600, step: 5, unit: 'min' },
      { key: 'intensity', type: 'select', optionsKey: 'intensity' },
      { key: 'steps', type: 'number', min: 0, max: 100000, step: 100 },
      { key: 'sedentaryHours', type: 'number', min: 0, max: 24, step: 0.5, unit: 'h' },
      { key: 'stretching', type: 'toggle' },
      { key: 'postExercise', type: 'select', optionsKey: 'postExercise' },
    ],
  },
  {
    id: 'symptoms',
    icon: '🤕',
    fields: [
      { key: 'painLevel', type: 'select', optionsKey: 'pain' },
      { key: 'headacheKind', type: 'multi', optionsKey: 'headacheKind' },
      { key: 'headacheStart', type: 'time' },
      { key: 'headacheEnd', type: 'time' },
      { key: 'headacheIntensity', type: 'number', min: 1, max: 10, step: 1 },
      { key: 'headacheLocation', type: 'multi', optionsKey: 'headacheLocation' },
      { key: 'headacheType', type: 'multi', optionsKey: 'headacheType' },
      { key: 'headacheAssociated', type: 'multi', optionsKey: 'headacheAssociated' },
      { key: 'triggers', type: 'multi', optionsKey: 'triggers' },
      { key: 'reliefTaken', type: 'text' },
      { key: 'reliefWorked', type: 'select', optionsKey: 'reliefWorked' },
      { key: 'otherSymptoms', type: 'multi', optionsKey: 'otherSymptoms' },
      { key: 'symptomNote', type: 'textarea', maxLength: 500 },
    ],
  },
  {
    id: 'medication',
    icon: '💊',
    fields: [
      { key: 'taken', type: 'meds' },
      { key: 'asNeeded', type: 'text' },
      { key: 'painkillerToday', type: 'toggle' },
    ],
  },
  {
    id: 'mood',
    icon: '🙂',
    fields: [
      { key: 'mood', type: 'select', optionsKey: 'scale5' },
      { key: 'stress', type: 'select', optionsKey: 'scale5' },
      { key: 'anxiety', type: 'toggle' },
      { key: 'energyMorning', type: 'select', optionsKey: 'scale5' },
      { key: 'energyAfternoon', type: 'select', optionsKey: 'scale5' },
      { key: 'energyEvening', type: 'select', optionsKey: 'scale5' },
      { key: 'focus', type: 'select', optionsKey: 'scale5' },
      { key: 'events', type: 'textarea', maxLength: 500 },
    ],
  },
  {
    id: 'cycle',
    icon: '🌙',
    fields: [
      { key: 'periodActive', type: 'toggle' },
      { key: 'flow', type: 'select', optionsKey: 'flow' },
      { key: 'pms', type: 'multi', optionsKey: 'pms' },
      { key: 'ovulationSigns', type: 'toggle' },
      { key: 'cycleNote', type: 'text' },
    ],
  },
  {
    id: 'environment',
    icon: '🌤️',
    fields: [
      { key: 'weather', type: 'text' },
      { key: 'pressure', type: 'select', optionsKey: 'pressure' },
      { key: 'airQuality', type: 'select', optionsKey: 'airQuality' },
      { key: 'screenHours', type: 'number', min: 0, max: 24, step: 0.5, unit: 'h' },
      { key: 'eyeStrain', type: 'toggle' },
      { key: 'posture', type: 'select', optionsKey: 'posture' },
      { key: 'travel', type: 'toggle' },
      { key: 'strongSmell', type: 'toggle' },
      { key: 'loudNoise', type: 'toggle' },
      { key: 'brightLight', type: 'toggle' },
      { key: 'dehydration', type: 'toggle' },
    ],
  },
  {
    id: 'illness',
    icon: '🤒',
    fields: [
      { key: 'sick', type: 'toggle' },
      { key: 'illnessSymptoms', type: 'text' },
      { key: 'appointments', type: 'textarea', maxLength: 500 },
      { key: 'injuries', type: 'textarea', maxLength: 500 },
      { key: 'vaccinations', type: 'text' },
    ],
  },
  {
    id: 'habits',
    icon: '✅',
    fields: [{ key: 'done', type: 'multi', optionsKey: 'habits' }],
  },
];

/** Selectable pain levels, [0..10]; option label is the number itself. */
export const PAIN_OPTION_VALUES = Array.from({ length: 11 }, (_, i) => String(i));

/** True when `key` (a category id, or `"<catId>.<fieldKey>"`) is hidden. */
export function isFieldHidden(hidden, categoryId, fieldKey) {
  return hidden.includes(categoryId) || hidden.includes(`${categoryId}.${fieldKey}`);
}

/**
 * `CATEGORIES` with the user's hidden categories dropped and hidden fields (and
 * the row slots that referenced them) filtered out. A category left with no
 * visible fields is dropped too.
 */
export function visibleCategories(hidden = []) {
  return CATEGORIES.filter((c) => !hidden.includes(c.id))
    .map((c) => {
      const fields = c.fields.filter((f) => !isFieldHidden(hidden, c.id, f.key));
      const visible = new Set(fields.map((f) => f.key));
      const rows = c.rows
        ? c.rows.map((r) => r.filter((k) => visible.has(k))).filter((r) => r.length > 0)
        : undefined;
      return { ...c, fields, rows };
    })
    .filter((c) => c.fields.length > 0);
}

/** A nested, empty `data` object keyed by category id. */
export function defaultData() {
  const out = {};
  for (const category of CATEGORIES) {
    out[category.id] = {};
    for (const field of category.fields) {
      out[category.id][field.key] =
        field.type === 'multi' ? [] : field.type === 'meds' ? {} : field.type === 'toggle' ? false : '';
    }
  }
  return out;
}

/** True when a single field holds something the user actually entered. */
export function fieldHasValue(field, value) {
  if (field.type === 'bmi') return false; // derived, never counts
  if (field.type === 'multi') return Array.isArray(value) && value.length > 0;
  if (field.type === 'meds') return value && Object.keys(value).length > 0;
  if (field.type === 'toggle') return value === true;
  return value !== '' && value !== null && value !== undefined;
}

/** `{ filled, count }` for a category card's status dot + badge. */
export function categoryStatus(data, category) {
  const bucket = data?.[category.id] ?? {};
  let count = 0;
  for (const field of category.fields) {
    if (fieldHasValue(field, bucket[field.key])) count += 1;
  }
  return { filled: count > 0, count };
}

/** Rounded BMI as a string, or '' when either input is missing/invalid. */
export function computeBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!w || !h) return '';
  const bmi = w / (h * h);
  if (!Number.isFinite(bmi)) return '';
  return bmi.toFixed(1);
}

/** Deep-merge a stored `data` object over `defaultData()` so the form always
 *  has every field, even for entries saved before a field existed. */
export function mergeData(stored) {
  const base = defaultData();
  if (!stored || typeof stored !== 'object') return base;
  for (const category of CATEGORIES) {
    const incoming = stored[category.id];
    if (incoming && typeof incoming === 'object') {
      base[category.id] = { ...base[category.id], ...incoming };
    }
  }
  return base;
}

const NUMERIC_LEGACY = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/** The four typed columns the calendar still reads, pulled from `data`. */
export function deriveLegacyColumns(data) {
  const symptoms = data?.symptoms ?? {};
  const sleep = data?.sleep ?? {};
  const quality = sleep.sleepQuality;
  return {
    painLevel: NUMERIC_LEGACY(symptoms.painLevel),
    sleepHours: NUMERIC_LEGACY(sleep.sleepHours),
    sleepQuality: OPTIONS.sleepQuality.includes(quality) ? quality : null,
    sleepNote: sleep.sleepNote?.trim() ? sleep.sleepNote.trim() : null,
  };
}
