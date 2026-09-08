import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { FLOW_DOT_PX, MOOD_COLORS, waterFill } from '@/features/health/calendarUtils';

/** A tumbler whose fill height tracks litres drunk (half at 1 L, full at 2 L). */
export function WaterGlass({ litres, title, className = 'h-3.5 w-3' }) {
  const id = useId();
  const level = 12 * waterFill(litres); // glass body is 12 units tall (y: 1 → 13)
  return (
    <svg viewBox="0 0 12 14" className={className} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={id}>
          <path d="M2.5 1 h7 l-1 12 h-5 z" />
        </clipPath>
      </defs>
      <rect
        x="0"
        y={13 - level}
        width="12"
        height={level}
        clipPath={`url(#${id})`}
        className="fill-sky-400/90"
      />
      <path d="M2.5 1 h7 l-1 12 h-5 z" fill="none" strokeWidth="1" className="stroke-sky-500" />
    </svg>
  );
}

/** Corner dot, red (low) → green (high) from the 1–5 mood scale. */
export function MoodDot({ mood, title, className = 'h-1.5 w-1.5' }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${MOOD_COLORS[mood] ?? 'bg-slate-400'} ${className}`}
      title={title}
    />
  );
}

/** Hollow emerald ring — the day had some logged activity. */
export function ExerciseRing({ title, className = 'h-2.5 w-2.5' }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-[1.5px] border-emerald-500 ${className}`}
      title={title}
    />
  );
}

/** Indigo crescent — a short or poor night. */
export function SleepCrescent({ title, className = 'h-3 w-3' }) {
  return (
    <svg viewBox="0 0 12 12" className={className} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <path d="M8.5 1a5 5 0 1 0 2.5 8.7A4 4 0 0 1 8.5 1z" className="fill-indigo-400" />
    </svg>
  );
}

/** Rose dot sized by menstrual flow (spotting → heavy). */
export function PeriodDot({ flow, title, ring = true }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full bg-rose-500 ${
        ring ? 'ring-1 ring-white dark:ring-surface' : ''
      }`}
      style={{ width: FLOW_DOT_PX[flow], height: FLOW_DOT_PX[flow] }}
      title={title}
    />
  );
}

/**
 * The glyph cluster drawn inside a month-view day cell. `summary` comes from
 * `summariseEntry`; render nothing when it's null.
 */
export function DayIndicators({ summary }) {
  const { t } = useTranslation();
  if (!summary) return null;

  const { flow, waterL, mood, poorSleep, exercised } = summary;

  return (
    <>
      {mood != null && (
        <MoodDot
          mood={mood}
          title={t('calendar.legendMood')}
          className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5"
        />
      )}

      {(waterL != null || exercised || poorSleep) && (
        <span className="pointer-events-none flex items-center gap-1">
          {waterL != null && (
            <WaterGlass
              litres={waterL}
              title={t('calendar.dayWater', { litres: Math.round(waterL * 10) / 10 })}
            />
          )}
          {exercised && <ExerciseRing title={t('calendar.legendExercise')} />}
          {poorSleep && <SleepCrescent title={t('calendar.legendSleep')} />}
        </span>
      )}

      {flow && (
        <span className="pointer-events-none absolute bottom-1 left-1 flex">
          <PeriodDot flow={flow} title={t(`calendar.flow.${flow}`)} />
        </span>
      )}
    </>
  );
}
