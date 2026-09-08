import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';
import { selectAuthProfile } from '@/features/auth/authSelectors';
import { todayIso } from '@/features/health/healthConstants';
import {
  monthMatrix,
  weekdayLabels,
  painColor,
  summariseEntry,
  FLOW_TINT,
} from '@/features/health/calendarUtils';
import { DayIndicators } from './DayIndicators';

/**
 * One month laid out as a 7-column grid.
 *
 * - `compact` renders tiny, non-interactive cells for the year overview
 *   (pain colour, with a rose tint on period days).
 * - otherwise each day is a button that calls `onSelectDay(iso)` and carries
 *   the at-a-glance indicators.
 */
export function MonthGrid({ cursor, entriesByDate, onSelectDay, compact = false }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const weeks = monthMatrix(cursor);
  const today = todayIso();
  const hidden = useAppSelector(selectAuthProfile)?.hidden_health_fields ?? [];

  if (compact) {
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map(({ iso, inMonth }) => {
          const entry = entriesByDate[iso];
          const summary = summariseEntry(entry, hidden);
          const tone = !inMonth
            ? 'bg-transparent'
            : !entry
              ? 'bg-surface-muted'
              : summary?.flow
                ? FLOW_TINT[summary.flow]
                : painColor(entry.pain_level);
          return (
            <span
              key={iso}
              className={`aspect-square rounded-[2px] ${tone} ${
                iso === today ? 'ring-1 ring-brand-600' : ''
              }`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-medium uppercase text-content-subtle">
        {weekdayLabels(locale).map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map(({ iso, inMonth }) => {
          const entry = entriesByDate[iso];
          const summary = summariseEntry(entry, hidden);
          const isToday = iso === today;
          const isFuture = iso > today;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(iso)}
              disabled={isFuture}
              className={`relative flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-sm transition ${
                isFuture
                  ? 'cursor-not-allowed border-transparent bg-surface-muted text-content-subtle opacity-50'
                  : inMonth
                    ? 'border-border bg-surface hover:border-brand-500 hover:bg-brand-50 dark:bg-surface-muted'
                    : 'border-transparent bg-surface-muted text-content-subtle dark:bg-canvas'
              } ${isToday ? 'ring-2 ring-brand-500' : ''}`}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className={inMonth ? 'text-content-muted' : ''}>
                {Number(iso.slice(8, 10))}
              </span>

              {entry && (
                <span className="mt-auto flex w-full flex-col items-center gap-0.5">
                  <DayIndicators summary={summary} />
                  <span
                    className={`h-1.5 w-full rounded-full ${painColor(entry.pain_level)}`}
                    title={
                      entry.pain_level != null
                        ? t('calendar.dayPain', { level: entry.pain_level })
                        : t('calendar.dayLogged')
                    }
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
