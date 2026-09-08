const TONES = {
  error:
    'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900',
  success:
    'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900',
  info: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-900',
};

export function Alert({ tone = 'info', className = '', children }) {
  if (!children) return null;
  return (
    <div
      role="status"
      className={`rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
