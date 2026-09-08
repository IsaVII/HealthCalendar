import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectAuthProfile } from '@/features/auth/authSelectors';
import { updateMyProfile } from '@/features/auth/authSlice';
import {
  loadMedications,
  addMedication,
  updateMedication,
  removeMedication,
  loadHabits,
  addHabit,
  updateHabit,
  removeHabit,
} from '@/features/health/healthSlice';
import {
  selectMedications,
  selectMedicationsStatus,
  selectMedicationsError,
  selectHabits,
  selectHabitsStatus,
  selectHabitsError,
} from '@/features/health/healthSelectors';
import { CATEGORIES, isFieldHidden } from '@/features/health/healthSchema';
import { selectUnitSystem } from '@/features/auth/authSelectors';
import {
  UNIT_SYSTEMS,
  unitConfig,
  toDisplayValue,
  toStoredValue,
  toDisplayBound,
} from '@/features/health/units';
import { geocode } from '@/features/weather/weatherApi';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

const SCHEDULES = ['daily', 'morning', 'evening', 'night', 'as_needed'];

function MedicationRow({ med }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [name, setName] = useState(med.name);
  const [dose, setDose] = useState(med.dose ?? '');

  const commit = (patch) => dispatch(updateMedication({ id: med.id, patch }));

  return (
    <li className="grid gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
      <FormField
        dense
        label={t('settings.medName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== med.name && commit({ name: name.trim() })}
      />
      <FormField
        dense
        label={t('settings.medDose')}
        value={dose}
        onChange={(e) => setDose(e.target.value)}
        onBlur={() => dose !== (med.dose ?? '') && commit({ dose: dose.trim() || null })}
      />
      <SelectField
        dense
        label={t('settings.medSchedule')}
        value={med.schedule ?? ''}
        onChange={(e) => commit({ schedule: e.target.value || null })}
      >
        <option value="">—</option>
        {SCHEDULES.map((s) => (
          <option key={s} value={s}>
            {t(`settings.schedules.${s}`)}
          </option>
        ))}
      </SelectField>
      <label className="flex min-h-9 items-center gap-1.5 text-sm text-content">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/30"
          checked={med.is_active}
          onChange={(e) => commit({ is_active: e.target.checked })}
        />
        {t('settings.medActive')}
      </label>
      <Button
        variant="ghost"
        className="w-auto px-2 text-red-600 hover:bg-red-50"
        onClick={() => {
          if (window.confirm(t('settings.medDeleteConfirm', { name: med.name }))) {
            dispatch(removeMedication(med.id));
          }
        }}
      >
        {t('settings.medDelete')}
      </Button>
    </li>
  );
}

function HabitRow({ habit }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [name, setName] = useState(habit.name);

  const commit = (patch) => dispatch(updateHabit({ id: habit.id, patch }));

  return (
    <li className="grid gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <FormField
        dense
        label={t('settings.habitName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== habit.name && commit({ name: name.trim() })}
      />
      <label className="flex min-h-9 items-center gap-1.5 text-sm text-content">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/30"
          checked={habit.is_active}
          onChange={(e) => commit({ is_active: e.target.checked })}
        />
        {t('settings.habitActive')}
      </label>
      <Button
        variant="ghost"
        className="w-auto px-2 text-red-600 hover:bg-red-50"
        onClick={() => {
          if (window.confirm(t('settings.habitDeleteConfirm', { name: habit.name }))) {
            dispatch(removeHabit(habit.id));
          }
        }}
      >
        {t('settings.habitDelete')}
      </Button>
    </li>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const meds = useAppSelector(selectMedications);
  const medsStatus = useAppSelector(selectMedicationsStatus);
  const medsError = useAppSelector(selectMedicationsError);
  const habits = useAppSelector(selectHabits);
  const habitsStatus = useAppSelector(selectHabitsStatus);
  const habitsError = useAppSelector(selectHabitsError);
  const profile = useAppSelector(selectAuthProfile);
  const unitSystem = useAppSelector(selectUnitSystem);
  const heightUnit = unitConfig('length', unitSystem);

  const [draft, setDraft] = useState({ name: '', dose: '', schedule: '' });
  const [habitDraft, setHabitDraft] = useState('');
  const [height, setHeight] = useState('');
  const [heightSaved, setHeightSaved] = useState(false);
  const [hidden, setHidden] = useState([]);
  const [place, setPlace] = useState('');
  const [placeStatus, setPlaceStatus] = useState('idle'); // idle | loading | error | saved

  useEffect(() => {
    dispatch(loadMedications());
    dispatch(loadHabits());
  }, [dispatch]);

  useEffect(() => {
    setHidden(profile?.hidden_health_fields ?? []);
  }, [profile?.hidden_health_fields]);

  const toggleHidden = (token) => {
    const next = hidden.includes(token)
      ? hidden.filter((x) => x !== token)
      : [...hidden, token];
    setHidden(next);
    dispatch(updateMyProfile({ hidden_health_fields: next }));
  };

  useEffect(() => {
    setHeight(
      profile?.default_height_cm != null
        ? toDisplayValue('length', unitSystem, profile.default_height_cm)
        : '',
    );
  }, [profile?.default_height_cm, unitSystem]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const result = await dispatch(addMedication(draft));
    if (addMedication.fulfilled.match(result)) setDraft({ name: '', dose: '', schedule: '' });
  }

  async function handleAddHabit(e) {
    e.preventDefault();
    const name = habitDraft.trim();
    if (!name) return;
    const result = await dispatch(addHabit({ name }));
    if (addHabit.fulfilled.match(result)) setHabitDraft('');
  }

  async function saveHeight(e) {
    e.preventDefault();
    const value = height === '' ? null : Number(toStoredValue('length', unitSystem, height));
    await dispatch(updateMyProfile({ default_height_cm: value }));
    setHeightSaved(true);
    setTimeout(() => setHeightSaved(false), 2500);
  }

  function setUnitSystem(next) {
    if (next !== unitSystem) dispatch(updateMyProfile({ unit_system: next }));
  }

  useEffect(() => {
    setPlace(profile?.weather_location ?? '');
  }, [profile?.weather_location]);

  async function findPlace(e) {
    e.preventDefault();
    const query = place.trim();
    if (!query) {
      await dispatch(
        updateMyProfile({ weather_location: null, weather_lat: null, weather_lon: null }),
      );
      setPlaceStatus('idle');
      return;
    }
    setPlaceStatus('loading');
    try {
      const { label, latitude, longitude } = await geocode(query, {
        language: i18n.resolvedLanguage,
      });
      await dispatch(
        updateMyProfile({
          weather_location: label,
          weather_lat: latitude,
          weather_lon: longitude,
        }),
      );
      setPlace(label);
      setPlaceStatus('saved');
      setTimeout(() => setPlaceStatus('idle'), 2500);
    } catch {
      setPlaceStatus('error');
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-content">{t('settings.title')}</h1>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">{t('settings.medications')}</h2>
          {medsStatus === 'loading' && <Spinner className="h-4 w-4 text-brand-600" />}
        </div>
        <p className="text-sm text-content-muted">{t('settings.medicationsHint')}</p>

        {medsError && <Alert tone="error">{medsError.message}</Alert>}

        {meds.length > 0 && (
          <ul className="space-y-2">
            {meds.map((med) => (
              <MedicationRow key={med.id} med={med} />
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAdd}
          className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        >
          <FormField
            dense
            label={t('settings.medName')}
            required
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <FormField
            dense
            label={t('settings.medDose')}
            value={draft.dose}
            onChange={(e) => setDraft((d) => ({ ...d, dose: e.target.value }))}
          />
          <SelectField
            dense
            label={t('settings.medSchedule')}
            value={draft.schedule}
            onChange={(e) => setDraft((d) => ({ ...d, schedule: e.target.value }))}
          >
            <option value="">—</option>
            {SCHEDULES.map((s) => (
              <option key={s} value={s}>
                {t(`settings.schedules.${s}`)}
              </option>
            ))}
          </SelectField>
          <Button type="submit" className="w-auto px-3">
            {t('settings.medAdd')}
          </Button>
        </form>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">{t('settings.habits')}</h2>
          {habitsStatus === 'loading' && <Spinner className="h-4 w-4 text-brand-600" />}
        </div>
        <p className="text-sm text-content-muted">{t('settings.habitsHint')}</p>

        {habitsError && <Alert tone="error">{habitsError.message}</Alert>}

        {habits.length > 0 && (
          <ul className="space-y-2">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAddHabit}
          className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <FormField
            dense
            label={t('settings.habitName')}
            required
            value={habitDraft}
            onChange={(e) => setHabitDraft(e.target.value)}
          />
          <Button type="submit" className="w-full px-4 sm:w-auto">
            {t('settings.habitAdd')}
          </Button>
        </form>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-content">{t('settings.fields')}</h2>
        <p className="text-sm text-content-muted">{t('settings.fieldsHint')}</p>

        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => {
            const catHidden = hidden.includes(cat.id);
            return (
              <details key={cat.id} className="rounded-lg border border-border">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-sm font-medium text-content [&::-webkit-details-marker]:hidden">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/30"
                    checked={!catHidden}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleHidden(cat.id)}
                  />
                  <span aria-hidden="true">{cat.icon}</span>
                  <span className="flex-1">{t(`health.categories.${cat.id}`)}</span>
                  <span className="text-content-subtle">▾</span>
                </summary>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2">
                  {cat.fields.map((f) => (
                    <label
                      key={f.key}
                      className={`flex items-center gap-1.5 text-sm text-content ${
                        catHidden ? 'opacity-40' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500/30"
                        disabled={catHidden}
                        checked={!isFieldHidden(hidden, cat.id, f.key)}
                        onChange={() => toggleHidden(`${cat.id}.${f.key}`)}
                      />
                      {t(`health.fields.${f.key}`)}
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-content">{t('settings.units')}</h2>
        <p className="text-sm text-content-muted">{t('settings.unitsHint')}</p>
        <SelectField
          dense
          className="w-56"
          label={t('settings.unitSystem')}
          value={unitSystem}
          onChange={(e) => setUnitSystem(e.target.value)}
        >
          {UNIT_SYSTEMS.map((s) => (
            <option key={s} value={s}>
              {t(`settings.unitSystems.${s}`)}
            </option>
          ))}
        </SelectField>
      </div>

      <form onSubmit={saveHeight} className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-content">{t('settings.body')}</h2>
        {heightSaved && <Alert tone="success">{t('settings.saved')}</Alert>}
        <div className="flex items-end gap-3">
          <FormField
            dense
            className="w-40"
            type="number"
            inputMode="decimal"
            min={toDisplayBound('length', unitSystem, 30)}
            max={toDisplayBound('length', unitSystem, 260)}
            step={heightUnit.step}
            label={`${t('settings.defaultHeight')} (${heightUnit.unit})`}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <Button type="submit" className="w-auto px-3">
            {t('common.save')}
          </Button>
        </div>
      </form>

      <form onSubmit={findPlace} className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-content">{t('settings.weather')}</h2>
        <p className="text-sm text-content-muted">{t('settings.weatherHint')}</p>
        {placeStatus === 'saved' && <Alert tone="success">{t('settings.saved')}</Alert>}
        {placeStatus === 'error' && <Alert tone="error">{t('settings.weatherError')}</Alert>}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <FormField
            dense
            label={t('settings.weatherLocation')}
            placeholder={t('settings.weatherPlaceholder')}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full px-4 sm:w-auto"
            loading={placeStatus === 'loading'}
          >
            {t('settings.weatherFind')}
          </Button>
        </div>
        {profile?.weather_lat != null && (
          <p className="text-xs text-content-subtle">
            {profile.weather_location} ({profile.weather_lat}, {profile.weather_lon})
          </p>
        )}
      </form>
    </section>
  );
}
