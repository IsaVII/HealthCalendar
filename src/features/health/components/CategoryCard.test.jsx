import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/utils';
import { CATEGORIES, defaultData } from '@/features/health/healthSchema';
import { CategoryCard } from './CategoryCard';

const meals = CATEGORIES.find((c) => c.id === 'meals');
const sleep = CATEGORIES.find((c) => c.id === 'sleep');

function setup(category, data, props = {}) {
  const onChangeField = props.onChangeField || vi.fn();
  const utils = renderWithProviders(
    <CategoryCard
      category={category}
      data={data}
      open
      onToggle={props.onToggle || (() => {})}
      onChangeField={onChangeField}
    />,
  );
  return { onChangeField, ...utils };
}

describe('CategoryCard', () => {
  it('shows the translated title and no count when empty', () => {
    setup(sleep, defaultData());
    expect(screen.getByText('Sleep')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows a filled-field count badge', () => {
    const data = defaultData();
    data.sleep.sleepHours = '7';
    data.sleep.awakenings = '2';
    setup(sleep, data);
    const summary = screen.getByText('Sleep').closest('summary');
    expect(within(summary).getByText('2')).toBeInTheDocument();
  });

  it('renders the explicit meals row layout with breakfast/lunch/dinner grouped', () => {
    setup(meals, defaultData());
    // one <details> summary + each field label
    expect(screen.getByLabelText('Breakfast')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakfast time')).toBeInTheDocument();
    expect(screen.getByLabelText('Lunch')).toBeInTheDocument();
    expect(screen.getByLabelText('Dinner')).toBeInTheDocument();
    expect(screen.getByLabelText(/Water \/ unsweetened tea/)).toBeInTheDocument();
  });

  it('bubbles field edits through onChangeField with the category id', async () => {
    const { onChangeField } = setup(meals, defaultData());
    await userEvent.type(screen.getByLabelText('Breakfast'), 'o');
    expect(onChangeField).toHaveBeenLastCalledWith('meals', 'breakfast', 'o');
  });

  it('reports open/close through onToggle', async () => {
    const onToggle = vi.fn();
    renderWithProviders(
      <CategoryCard
        category={sleep}
        data={defaultData()}
        open
        onToggle={onToggle}
        onChangeField={() => {}}
      />,
    );
    await userEvent.click(screen.getByText('Sleep'));
    expect(onToggle).toHaveBeenCalled();
  });
});
