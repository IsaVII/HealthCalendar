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
import { CalendarLegend } from '@/features/health/components/CalendarLegend';
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
        <h1 className="text-2xl font-bold text-content">{t('calendar.title')}</h1>
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {['month', 'year'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => dispatch(setCalendarView(v))}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                view === v
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface text-content-muted hover:bg-surface-muted'
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
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-content-muted hover:bg-surface-muted"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t('calendar.nextPeriod')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-content-muted hover:bg-surface-muted"
          >
            ›
          </button>
          <span className="ml-2 text-lg font-semibold capitalize text-content">
            {periodLabel}
          </span>
          {rangeStatus === 'loading' && <Spinner className="ml-1 h-4 w-4 text-brand-600" />}
        </div>
        <button
          type="button"
          onClick={() => dispatch(setCalendarCursor(todayIso()))}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-content-muted hover:bg-surface-muted"
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

      <CalendarLegend view={view} />
    </section>
  );
}
