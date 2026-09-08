import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectAuthProfile } from '@/features/auth/authSelectors';
import {
  loadEntryForDate,
  loadEntryBefore,
  saveEntryForDate,
  loadMedications,
} from '@/features/health/healthSlice';
import {
  selectHealthEntry,
  selectHealthPrevEntry,
  selectHealthLoadStatus,
  selectHealthSaving,
  selectHealthSavedAt,
  selectHealthError,
  selectHasEntry,
} from '@/features/health/healthSelectors';
import {
  todayIso,
  isIsoDate,
  entryToForm,
  formToValues,
} from '@/features/health/healthConstants';
import {
  CATEGORIES,
  mergeData,
  categoryStatus,
  visibleCategories,
} from '@/features/health/healthSchema';
import { CategoryCard } from '@/features/health/components/CategoryCard';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

const EMPTY_FORM = { data: mergeData(null) };

const catKey = (id) => `health.cat.${id}`;

function readStoredOpen() {
  const m = {};
  for (const c of CATEGORIES) {
    try {
      const v = localStorage.getItem(catKey(c.id));
      if (v !== null) m[c.id] = v === '1';
    } catch {
      /* private mode / disabled storage */
    }
  }
  return m;
}

function persistOpen(id, value) {
  try {
    localStorage.setItem(catKey(id), value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

// Only past/present days can be logged; anything else falls back to today.
const isSelectableDate = (value) => isIsoDate(value) && value <= todayIso();

export function HealthEntryPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [searchParams, setSearchParams] = useSearchParams();
  const paramDate = searchParams.get('date');
  const [date, setDate] = useState(() =>
    isSelectableDate(paramDate) ? paramDate : todayIso(),
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [openMap, setOpenMap] = useState(readStoredOpen);
  const hydratedFor = useRef(null);

  function changeDate(next) {
    const value = isSelectableDate(next) ? next : todayIso();
    setDate(value);
    setSearchParams(value === todayIso() ? {} : { date: value }, { replace: true });
  }

  const entry = useAppSelector(selectHealthEntry);
  const prevEntry = useAppSelector(selectHealthPrevEntry);
  const loadStatus = useAppSelector(selectHealthLoadStatus);
  const saving = useAppSelector(selectHealthSaving);
  const savedAt = useAppSelector(selectHealthSavedAt);
  const error = useAppSelector(selectHealthError);
  const hasEntry = useAppSelector(selectHasEntry);
  const profile = useAppSelector(selectAuthProfile);

  const categories = useMemo(
    () => visibleCategories(profile?.hidden_health_fields ?? []),
    [profile?.hidden_health_fields],
  );

  useEffect(() => {
    if (isSelectableDate(paramDate) && paramDate !== date) setDate(paramDate);
  }, [paramDate, date]);

  useEffect(() => {
    dispatch(loadMedications());
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadEntryForDate(date));
    dispatch(loadEntryBefore(date));
  }, [dispatch, date]);

  // Mirror the loaded entry into the form.
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    setForm(entry ? entryToForm(entry) : { data: mergeData(null) });
  }, [entry, loadStatus]);

  // For a day with no weight / height of its own, carry them over from the most
  // recent earlier entry (height falls back to the profile default). Only fills
  // blanks, so it never clobbers something already typed or a late prev-entry.
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    const prev = mergeData(prevEntry?.data).body;
    setForm((f) => {
      const b = f.data.body;
      const weightKg = b.weightKg || (prev.weightKg ? String(prev.weightKg) : '');
      const heightCm =
        b.heightCm ||
        (prev.heightCm
          ? String(prev.heightCm)
          : profile?.default_height_cm != null
            ? String(profile.default_height_cm)
            : '');
      if (weightKg === b.weightKg && heightCm === b.heightCm) return f;
      return { ...f, data: { ...f.data, body: { ...b, weightKg, heightCm } } };
    });
  }, [prevEntry, entry, loadStatus, profile]);

  // Once per loaded day, open any category that has data and has no explicit
  // saved preference; leave the rest as the user (or storage) left them.
  useEffect(() => {
    if (loadStatus !== 'ready' || hydratedFor.current === date) return;
    hydratedFor.current = date;
    const merged = mergeData(entry?.data);
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const c of categories) {
        if (next[c.id] === undefined && categoryStatus(merged, c).filled) next[c.id] = true;
      }
      return next;
    });
  }, [loadStatus, entry, date, categories]);

  const setOpen = (id, value) => {
    setOpenMap((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }));
    persistOpen(id, value);
  };

  const setAll = (value) => {
    setOpenMap(() => {
      const next = {};
      for (const c of categories) {
        next[c.id] = value;
        persistOpen(c.id, value);
      }
      return next;
    });
  };

  const changeField = (categoryId, fieldKey, value) => {
    setForm((f) => ({
      ...f,
      data: {
        ...f.data,
        [categoryId]: { ...f.data[categoryId], [fieldKey]: value },
      },
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    await dispatch(saveEntryForDate({ date, values: formToValues(form) }));
  }

  const loading = loadStatus === 'loading';

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-content">{t('health.title')}</h1>
        {loading && <Spinner className="h-4 w-4 text-brand-600" />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {hasEntry && !savedAt && <Alert tone="info">{t('health.existingNote')}</Alert>}

        <div className="flex flex-wrap items-end gap-3">
          <FormField
            dense
            className="w-40"
            label={t('health.dateLabel')}
            type="date"
            name="entry_date"
            max={todayIso()}
            value={date}
            onChange={(e) => changeDate(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setAll(true)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('health.expandAll')}
          </button>
          <span className="text-content-subtle">·</span>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('health.collapseAll')}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              data={form.data}
              open={Boolean(openMap[category.id])}
              onToggle={(value) => setOpen(category.id, value)}
              onChangeField={changeField}
            />
          ))}
        </div>

        <div className="sticky bottom-0 -mx-4 border-t border-border bg-canvas/90 px-4 py-2 backdrop-blur sm:bottom-0">
          <Button type="submit" loading={saving} disabled={loading}>
            {t('health.save')}
          </Button>
          {error && (
            <Alert tone="error" className="mt-2">
              {error.message || t('health.saveError')}
            </Alert>
          )}
          {savedAt && !error && (
            <Alert tone="success" className="mt-2">
              {t('health.saved')}
            </Alert>
          )}
        </div>
      </form>
    </section>
  );
}
