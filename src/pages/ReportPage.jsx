import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectDisplayName } from '@/features/auth/authSelectors';
import { loadMedications } from '@/features/health/healthSlice';
import { selectActiveMedications } from '@/features/health/healthSelectors';
import { healthService } from '@/features/health/HealthService';
import { todayIso } from '@/features/health/healthConstants';
import { addDays, parseIso } from '@/features/health/calendarUtils';
import { buildReport } from '@/features/health/reportUtils';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

const RANGES = [30, 90, 180, 365];

/**
 * A one-look health summary for a doctor's visit. Rendered as a light "paper"
 * sheet regardless of theme and printed with the browser's Save-as-PDF via
 * `window.print()` — the app chrome carries `.no-print` so only the sheet
 * comes out. Fetches its own span so it never disturbs the calendar's cache.
 */
export function ReportPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const dispatch = useAppDispatch();

  const name = useAppSelector(selectDisplayName);
  const meds = useAppSelector(selectActiveMedications);

  const [days, setDays] = useState(90);
  const [state, setState] = useState({ status: 'loading', entries: [], error: null });

  const to = todayIso();
  const from = addDays(to, -(days - 1));

  useEffect(() => {
    dispatch(loadMedications());
  }, [dispatch]);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    healthService
      .listEntries(from, to)
      .then((entries) => alive && setState({ status: 'ready', entries, error: null }))
      .catch(
        (err) =>
          alive &&
          setState({ status: 'error', entries: [], error: err?.message || 'Error' }),
      );
    return () => {
      alive = false;
    };
  }, [from, to]);

  const report = useMemo(
    () => buildReport({ entries: state.entries, from, to }),
    [state.entries, from, to],
  );

  const fmtDate = (iso) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
      parseIso(iso),
    );
  const fmtDay = (iso) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(parseIso(iso));

  const span = ({ from: a, to: b }) => (a === b ? fmtDay(a) : `${fmtDay(a)} – ${fmtDay(b)}`);
  const opt = (group, key) => t(`health.options.${group}.${key}`);

  return (
    <section className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-content">{t('report.title')}</h1>
          <p className="text-sm text-content-muted">{t('report.intro')}</p>
        </div>
        <div className="flex items-end gap-2">
          <SelectField
            dense
            className="w-40"
            label={t('report.rangeLabel')}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {RANGES.map((d) => (
              <option key={d} value={d}>
                {t('report.rangeDays', { count: d })}
              </option>
            ))}
          </SelectField>
          <Button
            type="button"
            className="w-auto px-3"
            onClick={() => window.print()}
            disabled={state.status !== 'ready'}
          >
            {t('report.print')}
          </Button>
        </div>
      </div>

      {state.status === 'error' && (
        <Alert tone="error">{state.error || t('calendar.loadError')}</Alert>
      )}

      <article className="report-paper mx-auto w-full max-w-[820px] rounded-xl border border-border bg-white p-6 text-[12px] leading-snug text-slate-900 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-slate-300 pb-2">
          <div>
            <h2 className="text-lg font-bold">{t('report.heading')}</h2>
            <p className="text-slate-600">
              {t('report.name')}: <span className="font-medium text-slate-900">{name || '—'}</span>
            </p>
          </div>
          <div className="text-right text-slate-600">
            <p>
              {t('report.period')}: {fmtDate(from)} – {fmtDate(to)}
            </p>
            <p>
              {t('report.coverage', {
                logged: report.range.daysLogged,
                total: report.range.totalDays,
              })}
            </p>
            <p>{t('report.generated', { date: fmtDate(to) })}</p>
          </div>
        </header>

        {state.status === 'loading' ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-5 w-5 text-brand-600" />
          </div>
        ) : report.range.daysLogged === 0 ? (
          <p className="py-8 text-center text-slate-500">{t('report.empty')}</p>
        ) : (
          <div className="mt-3 space-y-4">
            <Section title={t('report.overview')}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                {report.pain && (
                  <Stat label={t('report.pain')}>
                    {t('report.painSummary', {
                      avg: report.pain.avg,
                      max: report.pain.max,
                      high: report.pain.highDays,
                    })}
                  </Stat>
                )}
                {report.headache && (
                  <Stat label={t('report.headache')}>
                    {t('report.daysValue', { count: report.headache.days })}
                    {report.headache.avgIntensity != null &&
                      ` · ${t('report.avgIntensity', { value: report.headache.avgIntensity })}`}
                  </Stat>
                )}
                {report.sleep && (
                  <Stat label={t('report.sleep')}>
                    {t('report.sleepSummary', {
                      hours: report.sleep.avgHours ?? '—',
                      poor: report.sleep.poorNights,
                    })}
                  </Stat>
                )}
                {report.fluids && (
                  <Stat label={t('report.fluids')}>
                    {t('report.perDayLitres', { value: report.fluids.avgLitres })}
                  </Stat>
                )}
                {report.caffeine && (
                  <Stat label={t('report.caffeine')}>
                    {t('report.perDayCups', { value: report.caffeine.avgCups })}
                  </Stat>
                )}
                {report.exercise && (
                  <Stat label={t('report.exercise')}>
                    {t('report.daysValue', { count: report.exercise.days })}
                  </Stat>
                )}
                {report.alcohol && (
                  <Stat label={t('report.alcohol')}>
                    {t('report.alcoholSummary', {
                      days: report.alcohol.days,
                      units: report.alcohol.totalUnits,
                    })}
                  </Stat>
                )}
                {report.painkiller && (
                  <Stat label={t('report.painkiller')}>
                    {t('report.daysValue', { count: report.painkiller.days })}
                  </Stat>
                )}
                {report.period && (
                  <Stat label={t('report.period_')}>
                    {t('report.daysValue', { count: report.period.days })} ·{' '}
                    {report.period.spans.map(span).join(', ')}
                  </Stat>
                )}
              </dl>
            </Section>

            {meds.length > 0 && (
              <Section title={t('report.medications')}>
                <ul className="columns-2 gap-6">
                  {meds.map((m) => (
                    <li key={m.id} className="mb-0.5">
                      • {m.name}
                      {m.dose ? ` ${m.dose}` : ''}
                      {m.schedule ? ` — ${t(`settings.schedules.${m.schedule}`)}` : ''}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {report.headache && (
              <Section title={t('report.headacheLog')}>
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-left text-slate-600">
                      <th className="py-1 pr-2 font-medium">{t('report.colDate')}</th>
                      <th className="py-1 pr-2 font-medium">{t('report.colType')}</th>
                      <th className="py-1 pr-2 font-medium">{t('report.colIntensity')}</th>
                      <th className="py-1 pr-2 font-medium">{t('report.colTime')}</th>
                      <th className="py-1 pr-2 font-medium">{t('report.colRelief')}</th>
                      <th className="py-1 font-medium">{t('report.colHelped')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.headache.episodes.map((e, i) => (
                      <tr key={i} className="border-b border-slate-100 align-top">
                        <td className="py-1 pr-2 whitespace-nowrap">{fmtDay(e.date)}</td>
                        <td className="py-1 pr-2">
                          {e.kinds.map((k) => opt('headacheKind', k)).join(', ') || '—'}
                        </td>
                        <td className="py-1 pr-2">{e.intensity ?? '—'}</td>
                        <td className="py-1 pr-2 whitespace-nowrap">
                          {e.start ? `${e.start}${e.end ? `–${e.end}` : ''}` : '—'}
                        </td>
                        <td className="py-1 pr-2">{e.relief || '—'}</td>
                        <td className="py-1">{e.worked ? opt('reliefWorked', e.worked) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {(report.symptoms.length > 0 || report.triggers.length > 0) && (
              <Section title={t('report.frequent')}>
                {report.symptoms.length > 0 && (
                  <p>
                    <span className="text-slate-600">{t('report.symptoms')}: </span>
                    {report.symptoms
                      .map((s) => `${opt('otherSymptoms', s.key)} (${s.count})`)
                      .join(', ')}
                  </p>
                )}
                {report.triggers.length > 0 && (
                  <p>
                    <span className="text-slate-600">{t('report.triggers')}: </span>
                    {report.triggers
                      .map((s) => `${opt('triggers', s.key)} (${s.count})`)
                      .join(', ')}
                  </p>
                )}
              </Section>
            )}

            {report.notes.length > 0 && (
              <Section title={t('report.notes')}>
                <ul className="space-y-0.5">
                  {report.notes.map((n, i) => (
                    <li key={i}>
                      <span className="text-slate-600">{fmtDay(n.date)}</span>{' '}
                      <span className="text-slate-500">
                        ({t(`health.fields.${n.key}`)})
                      </span>{' '}
                      {n.text}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}

        <footer className="mt-4 border-t border-slate-300 pt-2 text-[10px] text-slate-500">
          {t('report.footer')}
        </footer>
      </article>

      <p className="no-print text-center text-xs text-content-subtle">
        <Link to="/calendar" className="hover:text-content">
          ← {t('nav.calendar')}
        </Link>
      </p>
    </section>
  );
}

function Section({ title, children }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-1 border-b border-slate-200 pb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ label, children }) {
  return (
    <div>
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
