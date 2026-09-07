import { useTranslation } from 'react-i18next';

import { categoryStatus } from '@/features/health/healthSchema';
import { FieldRenderer } from './FieldRenderer';

/**
 * One collapsible category on the daily entry. Presentational: `open` and
 * `onToggle` are owned by the page so "expand / collapse all" and the
 * localStorage persistence live in one place.
 */
export function CategoryCard({ category, data, open, onToggle, onChangeField }) {
  const { t } = useTranslation();
  const { filled, count } = categoryStatus(data, category);
  const bucket = data?.[category.id] ?? {};

  return (
    <details
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className="group rounded-xl border border-border bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-content [&::-webkit-details-marker]:hidden">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            filled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
          aria-hidden="true"
        />
        <span aria-hidden="true">{category.icon}</span>
        <span className="flex-1">{t(`health.categories.${category.id}`)}</span>
        {count > 0 && (
          <span className="rounded-full bg-brand-50 px-1.5 text-xs font-medium text-brand-700">
            {count}
          </span>
        )}
        <span className="text-content-subtle transition group-open:rotate-180">▾</span>
      </summary>

      <div className="grid gap-2 border-t border-border px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
        {category.fields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            data={data}
            value={bucket[field.key]}
            onChange={(next) => onChangeField(category.id, field.key, next)}
          />
        ))}
      </div>
    </details>
  );
}
