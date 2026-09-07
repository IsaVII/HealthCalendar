import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/utils';
import { defaultData } from '@/features/health/healthSchema';
import { FieldRenderer } from './FieldRenderer';

const render = (field, props = {}) =>
  renderWithProviders(
    <FieldRenderer field={field} value={props.value} data={defaultData()} onChange={props.onChange || (() => {})} {...props} />,
    props.options,
  );

describe('FieldRenderer', () => {
  it('number: shows the unit in the label and reports raw input', async () => {
    const onChange = vi.fn();
    render({ key: 'weightKg', type: 'number', unit: 'kg' }, { value: '', onChange });
    expect(screen.getByLabelText(/Weight \(kg\)/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Weight \(kg\)/), '8');
    expect(onChange).toHaveBeenCalledWith('8');
  });

  it('toggle: emits a boolean', async () => {
    const onChange = vi.fn();
    render({ key: 'skippedMeal', type: 'toggle' }, { value: false, onChange });
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('select: lists translated options plus an empty choice', () => {
    render({ key: 'intensity', type: 'select', optionsKey: 'intensity' }, { value: '' });
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(expect.arrayContaining(['—', 'Low', 'Moderate', 'High']));
  });

  it('multi: toggles a value in and out of the array', async () => {
    const onChange = vi.fn();
    render(
      { key: 'triggers', type: 'multi', optionsKey: 'triggers' },
      { value: [], onChange },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Stress' }));
    expect(onChange).toHaveBeenCalledWith(['stress']);

    onChange.mockClear();
    render(
      { key: 'triggers', type: 'multi', optionsKey: 'triggers' },
      { value: ['stress'], onChange },
    );
    await userEvent.click(screen.getAllByRole('button', { name: 'Stress' })[1]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('meds: empty state links to settings', () => {
    render({ key: 'taken', type: 'meds' }, { value: {} });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/settings');
  });

  it('meds: renders active medications as checkboxes', async () => {
    const onChange = vi.fn();
    render(
      { key: 'taken', type: 'meds' },
      {
        value: {},
        onChange,
        options: {
          preloadedState: {
            health: {
              medications: {
                items: [
                  { id: 'm1', name: 'Aspirin', dose: '100mg', is_active: true },
                  { id: 'm2', name: 'Hidden', is_active: false },
                ],
                status: 'ready',
                error: null,
              },
            },
          },
        },
      },
    );
    expect(screen.getByText(/Aspirin/)).toBeInTheDocument();
    expect(screen.queryByText(/Hidden/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith({ m1: true });
  });

  it('bmi: shows the derived value read-only', () => {
    renderWithProviders(
      <FieldRenderer
        field={{ key: 'bmi', type: 'bmi' }}
        value=""
        onChange={() => {}}
        data={{ body: { weightKg: '80', heightCm: '180' } }}
      />,
    );
    expect(screen.getByText('24.7')).toBeInTheDocument();
  });
});
