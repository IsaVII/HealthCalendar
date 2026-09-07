import { useTranslation } from 'react-i18next';

import { Spinner } from './Spinner';

export function FullPageSpinner() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand-600">
      <Spinner className="h-8 w-8" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
