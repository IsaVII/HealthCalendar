import { useTranslation } from 'react-i18next';

import { PAIN_BUCKETS, FLOW_LEVELS } from '@/features/health/calendarUtils';
import {
  WaterGlass,
  PeriodDot,
  MoodDot,
  ExerciseRing,
  SleepCrescent,
} from './DayIndicators';

function Row({ swatch, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-4 w-12 shrink-0 items-center justify-center gap-0.5">{swatch}</span>
      <span>{children}</span>
    </div>
  );
}

/**
 * Explains the calendar's colours and day-cell icons. The icon half only shows
 * in month view, where the icons are actually drawn.
 */
export function CalendarLegend({ view }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-xs text-content-muted">
      <p className="mb-2 font-semibold text-content">{t('calendar.legendTitle')}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="font-medium text-content-muted">{t('calendar.legendPain')}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {PAIN_BUCKETS.map((bucket) => (
              <span key={bucket.label} className="flex items-center gap-1">
                <span className={`h-3 w-3 rounded-sm ${bucket.className}`} /> {bucket.label}
              </span>
            ))}
          </div>
          <Row swatch={<span className="h-3 w-3 rounded-sm bg-slate-400" />}>
            {t('calendar.legendEntry')}
          </Row>
        </div>

        {view === 'month' && (
          <div className="space-y-1.5">
            <p className="font-medium text-content-muted">{t('calendar.legendIcons')}</p>
            <Row
              swatch={
                <>
                  <WaterGlass litres={0.6} className="h-4 w-3" />
                  <WaterGlass litres={2} className="h-4 w-3" />
                </>
              }
            >
              {t('calendar.legendWater')}
            </Row>
            <Row
              swatch={FLOW_LEVELS.map((f) => (
                <PeriodDot key={f} flow={f} ring={false} />
              ))}
            >
              {t('calendar.legendPeriod')}
            </Row>
            <Row
              swatch={
                <>
                  <MoodDot mood={1} className="h-2 w-2" />
                  <MoodDot mood={3} className="h-2 w-2" />
                  <MoodDot mood={5} className="h-2 w-2" />
                </>
              }
            >
              {t('calendar.legendMood')}
            </Row>
            <Row swatch={<ExerciseRing />}>{t('calendar.legendExercise')}</Row>
            <Row swatch={<SleepCrescent />}>{t('calendar.legendSleep')}</Row>
          </div>
        )}

        {view === 'year' && (
          <div className="space-y-1.5">
            <p className="font-medium text-content-muted">{t('calendar.legendIcons')}</p>
            <Row swatch={<span className="h-3 w-3 rounded-sm bg-rose-400" />}>
              {t('calendar.legendPeriodTint')}
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}
