import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { OPTIONS, PAIN_OPTION_VALUES, computeBmi } from '@/features/health/healthSchema';
import { selectActiveMedications, selectActiveHabits } from '@/features/health/healthSelectors';
import { selectUnitSystem, selectWeatherLocation } from '@/features/auth/authSelectors';
import {
  unitConfig,
  toDisplayValue,
  toStoredValue,
  toDisplayBound,
} from '@/features/health/units';
import { fetchCurrentWeather } from '@/features/weather/weatherApi';

/**
 * A number field whose stored value is always metric but which is entered and
 * shown in the user's chosen system. Keeps its own input text so a half-typed
 * "36." isn't rewritten mid-keystroke; re-syncs when the day changes or the
 * unit system flips.
 */
function ConvertedNumberField({ field, value, onChange, label, system }) {
  const cfg = unitConfig(field.convert, system);
  const [text, setText] = useState(() => toDisplayValue(field.convert, system, value));
  const stored = useRef(value);

  useEffect(() => {
    if (String(value) !== String(stored.current)) {
      stored.current = value;
      setText(toDisplayValue(field.convert, system, value));
    }
  }, [value, field.convert, system]);

  useEffect(() => {
    setText(toDisplayValue(field.convert, system, stored.current));
  }, [system, field.convert]);

  const handleChange = (e) => {
    const next = e.target.value;
    setText(next);
    const asMetric = toStoredValue(field.convert, system, next);
    stored.current = asMetric;
    onChange(asMetric);
  };

  return (
    <FormField
      dense
      type="number"
      inputMode="decimal"
      label={`${label} (${cfg.unit})`}
      min={toDisplayBound(field.convert, system, field.min)}
      max={toDisplayBound(field.convert, system, field.max)}
      step={cfg.step}
      value={text}
      onChange={handleChange}
    />
  );
}

const textareaClass =
  'block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

/**
 * The Environment "Weather" field: a free-text input plus a button that fills it
 * with current conditions for the location set in Settings (Open-Meteo), and
 * drops the sea-level pressure into the sibling "Barometric pressure" field.
 * Falls back to a plain text field + a link to Settings when no place is saved.
 */
function WeatherField({ label, value, onChange, onSetSibling }) {
  const { t } = useTranslation();
  const location = useAppSelector(selectWeatherLocation);
  const system = useAppSelector(selectUnitSystem);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'

  async function getWeather() {
    if (!location) return;
    setStatus('loading');
    try {
      const w = await fetchCurrentWeather(location.lat, location.lon, { system });
      const temp =
        w.min != null && w.max != null
          ? `${w.min}–${w.max}${w.tempUnit}`
          : `${w.now}${w.tempUnit}`;
      const bits = [t(`weather.groups.${w.dayGroup}`), temp];
      if (w.rain > 0) bits.push(`${w.rain} ${w.precipUnit}`);
      bits.push(`${t('weather.wind')} ${w.wind} ${w.windUnit}`);
      onChange(bits.join(', '));
      if (w.pressure != null) onSetSibling?.('pressure', String(w.pressure));
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <span className="mb-0.5 block text-xs font-medium text-content">{label}</span>
      <input
        className="block min-h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-content shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {location ? (
          <button
            type="button"
            onClick={getWeather}
            disabled={status === 'loading'}
            className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
          >
            {status === 'loading' ? t('weather.fetching') : t('weather.getButton')}
          </button>
        ) : (
          <Link
            to="/settings"
            className="rounded-lg border border-dashed border-border px-2.5 py-1 font-medium text-content-muted hover:text-content"
          >
            {t('weather.setLocation')}
          </Link>
        )}
        {status === 'error' ? (
          <span className="text-red-600">{t('weather.error')}</span>
        ) : (
          location?.label && <span className="text-content-subtle">{location.label}</span>
        )}
      </div>
    </div>
  );
}

/**
 * One field of the daily entry. `value` / `onChange(next)` are owned by the
 * parent card; `data` is the whole document (needed for the derived BMI).
 */
export function FieldRenderer({ field, value, onChange, data, onSetSibling }) {
  const { t } = useTranslation();
  const activeMeds = useAppSelector(selectActiveMedications);
  const activeHabits = useAppSelector(selectActiveHabits);
  const unitSystem = useAppSelector(selectUnitSystem);

  const label = t(`health.fields.${field.key}`);
  const withUnit = field.unit ? `${label} (${field.unit})` : label;

  const optionLabel = (v) =>
    field.optionsKey === 'pain' ? v : t(`health.options.${field.optionsKey}.${v}`);
  const optionValues =
    field.optionsKey === 'pain' ? PAIN_OPTION_VALUES : OPTIONS[field.optionsKey] ?? [];

  switch (field.type) {
    case 'number':
      if (field.convert) {
        return (
          <ConvertedNumberField
            field={field}
            value={value}
            onChange={onChange}
            label={label}
            system={unitSystem}
          />
        );
      }
      return (
        <FormField
          dense
          type="number"
          inputMode="decimal"
          label={withUnit}
          min={field.min}
          max={field.max}
          step={field.step}
          // Drop any legacy non-numeric value (e.g. an old select option) so the
          // number input doesn't warn about an unparseable value.
          value={value != null && value !== '' && !Number.isFinite(Number(value)) ? '' : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'text':
      return (
        <FormField
          dense
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'weather':
      return (
        <WeatherField
          label={label}
          value={value}
          onChange={onChange}
          onSetSibling={onSetSibling}
        />
      );

    case 'time':
      return (
        <FormField
          dense
          type="time"
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <SelectField
          dense
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {optionValues.map((v) => (
            <option key={v} value={v}>
              {optionLabel(v)}
            </option>
          ))}
        </SelectField>
      );

    case 'textarea':
      return (
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="mb-0.5 block text-xs font-medium text-content">{label}</span>
          <textarea
            rows={2}
            maxLength={field.maxLength}
            className={textareaClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );

    case 'toggle':
      return (
        <label className="flex min-h-9 items-center gap-2 text-sm text-content">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/30"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {label}
        </label>
      );

    case 'multi': {
      const selected = Array.isArray(value) ? value : [];
      const toggle = (v) =>
        onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
      return (
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-medium text-content">{label}</span>
          <div className="flex flex-wrap gap-1.5">
            {optionValues.map((v) => {
              const on = selected.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(v)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    on
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-border bg-surface text-content-muted hover:border-brand-500'
                  }`}
                >
                  {optionLabel(v)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case 'meds': {
      const taken = value && typeof value === 'object' ? value : {};
      if (activeMeds.length === 0) {
        return (
          <p className="text-sm text-content-muted sm:col-span-2 lg:col-span-3">
            {t('health.fields.noMedications')}{' '}
            <Link to="/settings" className="font-medium text-brand-600 hover:text-brand-700">
              {t('health.fields.manageMedications')}
            </Link>
          </p>
        );
      }
      const setMed = (id, next) => {
        const copy = { ...taken };
        if (next === undefined) delete copy[id];
        else copy[id] = next;
        onChange(copy);
      };
      return (
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-medium text-content">{label}</span>
          <ul className="space-y-1">
            {activeMeds.map((med) => {
              const on = Object.prototype.hasOwnProperty.call(taken, med.id);
              const time = typeof taken[med.id] === 'string' ? taken[med.id] : '';
              return (
                <li key={med.id} className="flex items-center gap-2 text-sm text-content">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/30"
                    checked={on}
                    onChange={(e) => setMed(med.id, e.target.checked ? true : undefined)}
                  />
                  <span className="flex-1 truncate">
                    {med.name}
                    {med.dose ? ` · ${med.dose}` : ''}
                  </span>
                  {on && (
                    <input
                      type="time"
                      aria-label={t('health.fields.takenTime')}
                      className="min-h-8 rounded-md border border-border bg-surface px-2 text-xs text-content"
                      value={time}
                      onChange={(e) => setMed(med.id, e.target.value || true)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    case 'habits': {
      const done = Array.isArray(value) ? value : [];
      if (activeHabits.length === 0) {
        return (
          <p className="text-sm text-content-muted sm:col-span-2 lg:col-span-3">
            {t('health.fields.noHabits')}{' '}
            <Link to="/settings" className="font-medium text-brand-600 hover:text-brand-700">
              {t('health.fields.manageHabits')}
            </Link>
          </p>
        );
      }
      const toggleHabit = (id) =>
        onChange(done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);
      return (
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-medium text-content">{label}</span>
          <div className="flex flex-wrap gap-1.5">
            {activeHabits.map((habit) => {
              const on = done.includes(habit.id);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    on
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-border bg-surface text-content-muted hover:border-brand-500'
                  }`}
                >
                  {habit.name}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case 'bmi': {
      const bmi = computeBmi(data?.body?.weightKg, data?.body?.heightCm);
      return (
        <div>
          <span className="mb-0.5 block text-xs font-medium text-content">{label}</span>
          <p className="min-h-9 rounded-lg border border-dashed border-border bg-surface-muted px-3 py-1.5 text-sm text-content-muted">
            {bmi || '—'}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}
