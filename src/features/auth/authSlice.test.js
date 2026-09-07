import { describe, it, expect } from 'vitest';

import reducer, {
  sessionChanged,
  loginUser,
  logoutUser,
  loadMyProfile,
  updateMyProfile,
} from './authSlice';

const initial = reducer(undefined, { type: '@@INIT' });

describe('sessionChanged', () => {
  it('goes anonymous with no session', () => {
    const s = reducer({ ...initial, status: 'authenticated' }, sessionChanged(null));
    expect(s.status).toBe('anonymous');
    expect(s.profile).toBeNull();
  });

  it('is unverified until the email is confirmed', () => {
    const s = reducer(initial, sessionChanged({ user: { id: 'u1' } }));
    expect(s.status).toBe('unverified');
  });

  it('is authenticated once email_confirmed_at is set', () => {
    const s = reducer(
      initial,
      sessionChanged({ user: { id: 'u1', email_confirmed_at: '2026-01-01' } }),
    );
    expect(s.status).toBe('authenticated');
    expect(s.user).toEqual({ id: 'u1', email_confirmed_at: '2026-01-01' });
  });
});

describe('thunk reducers', () => {
  it('loginUser.fulfilled derives status from the session', () => {
    const s = reducer(
      initial,
      loginUser.fulfilled(
        { session: { user: { email_confirmed_at: 'x' } }, user: { id: 'u1' } },
        'r',
        {},
      ),
    );
    expect(s.status).toBe('authenticated');
  });

  it('logoutUser.fulfilled wipes the session', () => {
    const s = reducer(
      { ...initial, status: 'authenticated', user: { id: 'u1' }, profile: { id: 'u1' } },
      logoutUser.fulfilled(undefined, 'r'),
    );
    expect(s).toMatchObject({ status: 'anonymous', user: null, profile: null });
  });

  it('loadMyProfile.fulfilled stores the profile', () => {
    const s = reducer(initial, loadMyProfile.fulfilled({ id: 'u1', username: 'bob' }, 'r'));
    expect(s.profile).toEqual({ id: 'u1', username: 'bob' });
  });

  it('updateMyProfile.fulfilled merges into the existing profile', () => {
    const s = reducer(
      { ...initial, profile: { id: 'u1', username: 'bob', default_height_cm: null } },
      updateMyProfile.fulfilled({ id: 'u1', default_height_cm: 180 }, 'r', {}),
    );
    expect(s.profile).toEqual({ id: 'u1', username: 'bob', default_height_cm: 180 });
  });
});

describe('shared pending / rejected matchers', () => {
  it('sets pending on any auth/* pending and clears it on settle', () => {
    let s = reducer(initial, loginUser.pending('r', {}));
    expect(s.pending).toBe(true);
    s = reducer(s, loginUser.rejected(null, 'r', {}, { code: 'invalidCredentials' }));
    expect(s.pending).toBe(false);
    expect(s.error).toEqual({ code: 'invalidCredentials' });
  });
});
