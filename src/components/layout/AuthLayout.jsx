import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/features/theme/ThemeToggle';

/** Centered card layout for the unauthenticated pages. Mobile-first. */
export function AuthLayout({ title, children, footer }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col safe-px">
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-4">
        <span className="text-lg font-bold text-brand-700">{t('common.appName')}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
        <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-border sm:p-8">
          <h1 className="mb-6 text-xl font-bold text-content">{title}</h1>
          {children}
        </div>
        {footer ? <div className="mt-4 text-center text-sm text-content-muted">{footer}</div> : null}
      </main>
    </div>
  );
}
