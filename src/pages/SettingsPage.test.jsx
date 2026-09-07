import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/utils';

const listMedications = vi.fn();
const createMedication = vi.fn();
const updateMyProfile = vi.fn();

vi.mock('@/features/health/MedicationService', () => ({
  medicationService: {
    listMedications: (...a) => listMedications(...a),
    createMedication: (...a) => createMedication(...a),
    updateMedication: vi.fn().mockResolvedValue({ id: 'm1' }),
    deleteMedication: vi.fn().mockResolvedValue('m1'),
  },
}));

vi.mock('@/features/auth/ProfileService', () => ({
  profileService: {
    updateMyProfile: (...a) => updateMyProfile(...a),
    getMyProfile: vi.fn().mockResolvedValue(null),
  },
}));

import { SettingsPage } from './SettingsPage';

beforeEach(() => {
  vi.clearAllMocks();
  listMedications.mockResolvedValue([]);
  createMedication.mockResolvedValue({ id: 'm1', name: 'Aspirin', is_active: true });
  updateMyProfile.mockResolvedValue({ id: 'u1' });
});

const profileState = {
  auth: {
    status: 'authenticated',
    session: null,
    user: { id: 'u1' },
    profile: { id: 'u1', username: 'bob', default_height_cm: null, hidden_health_fields: [] },
    error: null,
    pending: false,
  },
};

describe('SettingsPage', () => {
  it('loads medications on mount', async () => {
    renderWithProviders(<SettingsPage />, { preloadedState: profileState });
    await waitFor(() => expect(listMedications).toHaveBeenCalled());
    expect(screen.getByText('Regular medications')).toBeInTheDocument();
  });

  it('adds a medication through the form', async () => {
    renderWithProviders(<SettingsPage />, { preloadedState: profileState });
    await userEvent.type(screen.getAllByLabelText('Name')[0], 'Aspirin');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(createMedication).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Aspirin' }),
      ),
    );
  });

  it('hiding a field persists it to the profile', async () => {
    renderWithProviders(<SettingsPage />, { preloadedState: profileState });
    // expand the Meals group, then untick "Caffeine"
    await userEvent.click(screen.getByText('Meals & nutrition'));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Caffeine' }));
    await waitFor(() =>
      expect(updateMyProfile).toHaveBeenCalledWith({
        hidden_health_fields: ['meals.caffeineCups'],
      }),
    );
  });
});
