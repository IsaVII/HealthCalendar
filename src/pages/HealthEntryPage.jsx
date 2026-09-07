import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loadEntryForDate, saveEntryForDate } from '@/features/health/healthSlice';
import {
  selectHealthEntry,
  selectHealthLoadStatus,
  selectHealthSaving,
  selectHealthSavedAt,
  selectHealthError,
  selectHasEntry,
} from '@/features/health/healthSelectors';
import {
  SLEEP_QUALITY_VALUES,
  PAIN_LEVELS,
  SLEEP_HOURS_MIN,
  SLEEP_HOURS_MAX,
  todayIso,
  isIsoDate,
  entryToForm,
  formToValues,
} from '@/features/health/healthConstants';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

const EMPTY_FORM = { painLevel: '', sleepHours: '', sleepQuality: '' };

// Only past/present days can be logged; anything else falls back to today.
const isSelectableDate = (value) => isIsoDate(value) && value <= todayIso();

export function HealthEntryPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // The day in view can be linked to from the calendar as ?date=YYYY-MM-DD.
  const [searchParams, setSearchParams] = useSearchParams();
  const paramDate = searchParams.get('date');
  const [date, setDate] = useState(() =>
    isSelectableDate(paramDate) ? paramDate : todayIso(),
  );
  const [form, setForm] = useState(EMPTY_FORM);

  function changeDate(next) {
    const value = isSelectableDate(next) ? next : todayIso();
    setDate(value);
    setSearchParams(value === todayIso() ? {} : { date: value }, { replace: true });
  }

  const entry = useAppSelector(selectHealthEntry);
  const loadStatus = useAppSelector(selectHealthLoadStatus);
  const saving = useAppSelector(selectHealthSaving);
  const savedAt = useAppSelector(selectHealthSavedAt);
  const error = useAppSelector(selectHealthError);
  const hasEntry = useAppSelector(selectHasEntry);

  // Follow the ?date= param when the page is already mounted (e.g. a second
  // click from the calendar).
  useEffect(() => {
    if (isSelectableDate(paramDate) && paramDate !== date) setDate(paramDate);
  }, [paramDate, date]);

  // Auto-load whenever the selected date changes (on mount it's today or ?date=).
  useEffect(() => {
    dispatch(loadEntryForDate(date));
  }, [dispatch, date]);

  // Mirror the loaded entry into the form: populate it when a row exists for
  // this day, blank it when there's nothing logged yet.
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    setForm(entry ? entryToForm(entry) : EMPTY_FORM);
  }, [entry, loadStatus]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    await dispatch(saveEntryForDate({ date, values: formToValues(form) }));
  }

  const loading = loadStatus === 'loading';

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-content">{t('health.title')}</h1>
        {loading && <Spinner className="h-4 w-4 text-brand-600" />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error.message || t('health.saveError')}</Alert>}
        {savedAt && !error && <Alert tone="success">{t('health.saved')}</Alert>}
        {hasEntry && !savedAt && <Alert tone="info">{t('health.existingNote')}</Alert>}

        <FormField
          label={t('health.dateLabel')}
          type="date"
          name="entry_date"
          max={todayIso()}
          value={date}
          onChange={(e) => changeDate(e.target.value)}
        />

        <SelectField
          label={t('health.painLevel')}
          name="pain_level"
          hint={t('health.painLevelHint')}
          disabled={loading}
          value={form.painLevel}
          onChange={update('painLevel')}
        >
          <option value="">{t('health.painLevelNone')}</option>
          {PAIN_LEVELS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectField>

        <FormField
          label={t('health.sleepHours')}
          type="number"
          name="sleep_hours"
          inputMode="decimal"
          min={SLEEP_HOURS_MIN}
          max={SLEEP_HOURS_MAX}
          step={0.5}
          disabled={loading}
          value={form.sleepHours}
          onChange={update('sleepHours')}
        />

        <SelectField
          label={t('health.sleepQuality')}
          name="sleep_quality"
          disabled={loading}
          value={form.sleepQuality}
          onChange={update('sleepQuality')}
        >
          <option value="">{t('health.sleepQualityOptions.none')}</option>
          {SLEEP_QUALITY_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`health.sleepQualityOptions.${value}`)}
            </option>
          ))}
        </SelectField>

        <Button type="submit" loading={saving} disabled={loading}>
          {t('health.save')}
        </Button>
      </form>
    </section>
  );
}
