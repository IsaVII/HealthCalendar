import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';
import { selectDisplayName } from '@/features/auth/authSelectors';

export function DashboardPage() {
  const { t } = useTranslation();
  const name = useAppSelector(selectDisplayName);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
      <p className="text-slate-700">{t('dashboard.welcome', { name })}</p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        {t('dashboard.placeholder')}
      </div>
    </section>
  );
}
