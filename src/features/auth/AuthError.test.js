import { describe, it, expect } from 'vitest';

import { AuthError } from './AuthError';

describe('AuthError.from', () => {
  it('passes an AuthError through unchanged', () => {
    const original = new AuthError('weakPassword', 'too short');
    expect(AuthError.from(original)).toBe(original);
  });

  it('maps known Supabase messages to stable codes', () => {
    expect(AuthError.from({ message: 'Invalid login credentials' }).code).toBe(
      'invalidCredentials',
    );
    expect(AuthError.from({ message: 'Email not confirmed' }).code).toBe(
      'emailNotConfirmed',
    );
    expect(AuthError.from({ message: 'User already registered' }).code).toBe(
      'usernameTaken',
    );
    expect(AuthError.from({ message: 'Password should be at least 6 characters' }).code).toBe(
      'weakPassword',
    );
  });

  it('falls back to a generic code', () => {
    expect(AuthError.from({ message: 'kaboom' }).code).toBe('generic');
    expect(AuthError.from(null).code).toBe('generic');
  });
});

describe('AuthError shape', () => {
  it('exposes an i18n key and a serialisable form', () => {
    const err = new AuthError('emailNotConfirmed', 'nope');
    expect(err.i18nKey).toBe('auth.errors.emailNotConfirmed');
    expect(err.toJSON()).toEqual({ code: 'emailNotConfirmed', message: 'nope' });
    expect(JSON.parse(JSON.stringify(err.toJSON()))).toEqual(err.toJSON());
  });
});
