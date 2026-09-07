import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectDisplayName } from '@/features/auth/authSelectors';
import { loadEntriesInRange } from '@/features/health/healthSlice';
import {
  selectEntriesByDate,
  selectRangeStatus,
  selectRangeError,
} from '@/features/health/healthSelectors';
import { todayIso } from '@/features/health/healthConstants';
import { monthLabel, rangeForView } from '@/features/health/calendarUtils';
import { MonthGrid } from '@/features/health/components/MonthGrid';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const name = useAppSelector(selectDisplayName);
  const entriesByDate = useAppSelector(selectEntriesByDate);
  const rangeStatus = useAppSelector(selectRangeStatus);
  const rangeError = useAppSelector(selectRangeError);

  const today = todayIso();

  useEffect(() => {
    dispatch(loadEntriesInRange(rangeForView('month', today)));
  }, [dispatch, today]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
      <p className="text-slate-700">{t('dashboard.welcome', { name })}</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <h2 className="text-lg font-semibold capitalize text-slate-800">
            {monthLabel(locale, today, { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            {rangeStatus === 'loading' && <Spinner className="h-4 w-4 text-brand-600" />}
            <Link
              to="/calendar"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {t('dashboard.viewFullCalendar')}
            </Link>
          </div>
        </div>

        {rangeStatus === 'error' && (
          <Alert tone="error">{rangeError?.message || t('calendar.loadError')}</Alert>
        )}

        <MonthGrid
          cursor={today}
          entriesByDate={entriesByDate}
          onSelectDay={(iso) => navigate(`/health?date=${iso}`)}
        />
      </div>
    </section>
  );
}
