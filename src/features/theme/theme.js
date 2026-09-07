export const THEME_STORAGE_KEY = 'hc.theme';

/** Resolve the theme to apply: the stored choice, else the OS preference. */
export function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage unavailable — fall through to the system preference. */
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/** Reflect the theme on <html> and the browser chrome colour. */
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#0f766e');
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore — the choice just won't persist across reloads. */
  }
}

export function hasStoredTheme() {
  try {
    return Boolean(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return false;
  }
}
