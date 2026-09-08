import { useTranslation } from 'react-i18next';

import { categoryStatus } from '@/features/health/healthSchema';
import { FieldRenderer } from './FieldRenderer';

/** Per-field width inside an explicit `category.rows` layout. */
function itemClass(field) {
  switch (field.type) {
    case 'time':
      return 'w-28 shrink-0';
    case 'number':
      return 'w-24 shrink-0';
    case 'select':
      return 'min-w-[8rem] flex-1';
    case 'toggle':
      return 'shrink-0';
    case 'text':
      return 'min-w-[10rem] flex-1';
    default:
      return 'w-full';
  }
}

/**
 * One collapsible category on the daily entry. Presentational: `open` and
 * `onToggle` are owned by the page so "expand / collapse all" and the
 * localStorage persistence live in one place.
 */
export function CategoryCard({ category, data, open, onToggle, onChangeField, className = '' }) {
  const { t } = useTranslation();
  const { filled, count } = categoryStatus(data, category);
  const bucket = data?.[category.id] ?? {};
  const fieldByKey = Object.fromEntries(category.fields.map((f) => [f.key, f]));

  const renderField = (field) => (
    <FieldRenderer
      key={field.key}
      field={field}
      data={data}
      value={bucket[field.key]}
      onChange={(next) => onChangeField(category.id, field.key, next)}
    />
  );

  return (
    <details
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className={`group rounded-xl border border-border bg-surface ${className}`}
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

      {category.rows ? (
        <div className="space-y-2 border-t border-border px-3 py-3">
          {category.rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              {row.map((key) => (
                <div key={key} className={itemClass(fieldByKey[key])}>
                  {renderField(fieldByKey[key])}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 border-t border-border px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.fields.map(renderField)}
        </div>
      )}
    </details>
  );
}
