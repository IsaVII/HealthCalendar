import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutUser } from '@/features/auth/authSlice';
import { selectDisplayName } from '@/features/auth/authSelectors';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/Button';

/** Shell for authenticated pages: top bar + a bottom tab bar on mobile. */
export function AppLayout() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const name = useAppSelector(selectDisplayName);

  const navItems = [{ to: '/dashboard', label: t('nav.dashboard') }];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-200 bg-white safe-px">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between py-3">
          <span className="font-bold text-brand-700">{t('common.appName')}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-sm text-slate-500 sm:inline">{name}</span>
            <Button
              variant="ghost"
              className="w-auto px-2"
              onClick={() => dispatch(logoutUser())}
            >
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 safe-px">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-slate-200 bg-white sm:hidden">
        <ul className="mx-auto flex max-w-3xl">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-12 items-center justify-center text-sm font-medium ${
                    isActive ? 'text-brand-700' : 'text-slate-500'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
