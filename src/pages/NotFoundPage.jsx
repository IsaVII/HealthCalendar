import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-content">{t('notFound.title')}</h1>
      <Link to="/" className="font-semibold text-brand-700">
        {t('notFound.back')}
      </Link>
    </div>
  );
}
