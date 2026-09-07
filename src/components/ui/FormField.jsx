import { useId } from 'react';

/**
 * Label + input + hint/error, wired for accessibility.
 * Pass any <input> props through; use `as="whatever"` is not needed yet.
 */
export function FormField({
  label,
  hint,
  error,
  type = 'text',
  className = '',
  dense = false,
  ...inputProps
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`block font-medium text-content ${dense ? 'mb-0.5 text-xs' : 'mb-1 text-sm'}`}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-surface px-3 text-content shadow-sm outline-none transition focus:ring-2 ${
          dense ? 'min-h-9 text-sm' : 'min-h-11 text-base'
        } ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-border focus:border-brand-500 focus:ring-brand-500/30'
        }`}
        {...inputProps}
      />
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
