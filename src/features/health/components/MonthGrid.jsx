import { useTranslation } from 'react-i18next';

import { todayIso } from '@/features/health/healthConstants';
import { monthMatrix, weekdayLabels, painColor } from '@/features/health/calendarUtils';

/**
 * One month laid out as a 7-column grid.
 *
 * - `compact` renders tiny, non-interactive cells for the year overview.
 * - otherwise each day is a button that calls `onSelectDay(iso)`.
 */
export function MonthGrid({ cursor, entriesByDate, onSelectDay, compact = false }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const weeks = monthMatrix(cursor);
  const today = todayIso();

  if (compact) {
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map(({ iso, inMonth }) => {
          const entry = entriesByDate[iso];
          return (
            <span
              key={iso}
              className={`aspect-square rounded-[2px] ${
                !inMonth
                  ? 'bg-transparent'
                  : entry
                    ? painColor(entry.pain_level)
                    : 'bg-surface-muted'
              } ${iso === today ? 'ring-1 ring-brand-600' : ''}`}
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
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(iso)}
              className={`flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-sm transition ${
                inMonth
                  ? 'border-border bg-surface hover:border-brand-500 hover:bg-brand-50'
                  : 'border-transparent bg-surface-muted text-content-subtle'
              } ${isToday ? 'ring-2 ring-brand-500' : ''}`}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className={inMonth ? 'text-content-muted' : ''}>
                {Number(iso.slice(8, 10))}
              </span>
              {entry && (
                <span
                  className={`mt-auto h-1.5 w-full rounded-full ${painColor(entry.pain_level)}`}
                  title={
                    entry.pain_level != null
                      ? t('calendar.dayPain', { level: entry.pain_level })
                      : t('calendar.dayLogged')
                  }
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
