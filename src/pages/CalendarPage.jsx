import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  loadEntriesInRange,
  setCalendarView,
  setCalendarCursor,
} from '@/features/health/healthSlice';
import {
  selectCalendarView,
  selectCalendarCursor,
  selectEntriesByDate,
  selectRangeStatus,
  selectRangeError,
} from '@/features/health/healthSelectors';
import { todayIso } from '@/features/health/healthConstants';
import {
  addMonths,
  addYears,
  startOfMonth,
  monthLabel,
  parseIso,
  rangeForView,
} from '@/features/health/calendarUtils';
import { MonthGrid } from '@/features/health/components/MonthGrid';
import { YearGrid } from '@/features/health/components/YearGrid';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const view = useAppSelector(selectCalendarView);
  const cursor = useAppSelector(selectCalendarCursor);
  const entriesByDate = useAppSelector(selectEntriesByDate);
  const rangeStatus = useAppSelector(selectRangeStatus);
  const rangeError = useAppSelector(selectRangeError);

  useEffect(() => {
    dispatch(loadEntriesInRange(rangeForView(view, cursor)));
  }, [dispatch, view, cursor]);

  const step = (dir) =>
    dispatch(
      setCalendarCursor(view === 'year' ? addYears(cursor, dir) : addMonths(cursor, dir)),
    );

  const openMonth = (monthIso) => {
    dispatch(setCalendarCursor(startOfMonth(monthIso)));
    dispatch(setCalendarView('month'));
  };

  const periodLabel =
    view === 'year'
      ? String(parseIso(cursor).getFullYear())
      : monthLabel(locale, cursor, { month: 'long', year: 'numeric' });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t('calendar.title')}</h1>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
          {['month', 'year'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => dispatch(setCalendarView(v))}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                view === v ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t(`calendar.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t('calendar.prevPeriod')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t('calendar.nextPeriod')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          >
            ›
          </button>
          <span className="ml-2 text-lg font-semibold capitalize text-slate-800">
            {periodLabel}
          </span>
          {rangeStatus === 'loading' && <Spinner className="ml-1 h-4 w-4 text-brand-600" />}
        </div>
        <button
          type="button"
          onClick={() => dispatch(setCalendarCursor(todayIso()))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {t('calendar.today')}
        </button>
      </div>

      {rangeStatus === 'error' && (
        <Alert tone="error">{rangeError?.message || t('calendar.loadError')}</Alert>
      )}

      {view === 'year' ? (
        <YearGrid cursor={cursor} entriesByDate={entriesByDate} onOpenMonth={openMonth} />
      ) : (
        <MonthGrid
          cursor={cursor}
          entriesByDate={entriesByDate}
          onSelectDay={(iso) => navigate(`/health?date=${iso}`)}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-500">
        <span className="font-medium">{t('calendar.legendPain')}:</span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-emerald-400" /> 0
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-yellow-300" /> 5
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-600" /> 10
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-slate-400" /> {t('calendar.legendEntry')}
        </span>
      </div>
    </section>
  );
}
