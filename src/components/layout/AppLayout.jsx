import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutUser } from '@/features/auth/authSlice';
import { selectDisplayName } from '@/features/auth/authSelectors';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { Button } from '@/components/ui/Button';

/** Shell for authenticated pages: top bar + a bottom tab bar on mobile. */
export function AppLayout() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const name = useAppSelector(selectDisplayName);

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/calendar', label: t('nav.calendar') },
    { to: '/health', label: t('nav.health') },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface safe-px">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-brand-700">{t('common.appName')}</span>
            <nav className="hidden gap-4 sm:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-content-muted hover:text-content'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `text-lg leading-none ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`
              }
              aria-label={t('nav.settings')}
              title={t('nav.settings')}
            >
              ⚙️
            </NavLink>
            <ThemeToggle />
            <LanguageSwitcher />
            <span className="hidden text-sm text-content-muted sm:inline">{name}</span>
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

      <nav className="sticky bottom-0 border-t border-border bg-surface sm:hidden">
        <ul className="mx-auto flex max-w-3xl">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-12 items-center justify-center text-sm font-medium ${
                    isActive ? 'text-brand-700' : 'text-content-muted'
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
