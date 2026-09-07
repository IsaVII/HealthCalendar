import { useId } from 'react';

/**
 * Label + <select> + hint/error, wired for accessibility.
 * Pass <option> elements as children and any <select> props through.
 */
export function SelectField({ label, hint, error, className = '', children, ...selectProps }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-content">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`block min-h-11 w-full rounded-lg border bg-surface px-3 text-base text-content shadow-sm outline-none transition focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-border focus:border-brand-500 focus:ring-brand-500/30'
        }`}
        {...selectProps}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-content-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
