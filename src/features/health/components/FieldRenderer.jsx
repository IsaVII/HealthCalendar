import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { OPTIONS, PAIN_OPTION_VALUES, computeBmi } from '@/features/health/healthSchema';
import { selectActiveMedications } from '@/features/health/healthSelectors';

const textareaClass =
  'block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

/**
 * One field of the daily entry. `value` / `onChange(next)` are owned by the
 * parent card; `data` is the whole document (needed for the derived BMI).
 */
export function FieldRenderer({ field, value, onChange, data }) {
  const { t } = useTranslation();
  const activeMeds = useAppSelector(selectActiveMedications);

  const label = t(`health.fields.${field.key}`);
  const withUnit = field.unit ? `${label} (${field.unit})` : label;

  const optionLabel = (v) =>
    field.optionsKey === 'pain' ? v : t(`health.options.${field.optionsKey}.${v}`);
  const optionValues =
    field.optionsKey === 'pain' ? PAIN_OPTION_VALUES : OPTIONS[field.optionsKey] ?? [];

  switch (field.type) {
    case 'number':
      return (
        <FormField
          dense
          type="number"
          inputMode="decimal"
          label={withUnit}
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
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
