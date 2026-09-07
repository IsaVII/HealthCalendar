import { useTranslation } from 'react-i18next';

import { monthsOfYear, monthLabel } from '@/features/health/calendarUtils';
import { MonthGrid } from './MonthGrid';

/**
 * Twelve compact month tiles. Clicking a tile opens that month in month view
 * via `onOpenMonth(iso)`.
 */
export function YearGrid({ cursor, entriesByDate, onOpenMonth }) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {monthsOfYear(cursor).map((monthIso) => (
        <button
          key={monthIso}
          type="button"
          onClick={() => onOpenMonth(monthIso)}
          className="rounded-xl border border-border bg-surface p-3 text-left transition hover:border-brand-500 hover:bg-brand-50"
        >
          <div className="mb-2 text-sm font-semibold capitalize text-content-muted">
            {monthLabel(locale, monthIso, { month: 'long' })}
          </div>
          <MonthGrid cursor={monthIso} entriesByDate={entriesByDate} compact />
        </button>
      ))}
    </div>
  );
}
