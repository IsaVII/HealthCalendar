import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@/i18n';

export function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();

  return (
    <label className={`inline-flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="min-h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng.code} value={lng.code}>
            {lng.label}
          </option>
        ))}
      </select>
    </label>
  );
}
