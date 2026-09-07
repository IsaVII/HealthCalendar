import { describe, it, expect } from 'vitest';

import {
  isEmail,
  isUsername,
  classifyIdentifier,
  validateRegistration,
  MIN_PASSWORD_LENGTH,
} from './validation';

describe('isEmail', () => {
  it('accepts a normal address and trims surrounding space', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isEmail('no-at-sign')).toBe(false);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a @b.co')).toBe(false);
  });
});

describe('isUsername', () => {
  it('accepts 3–30 chars of letters, digits and underscores', () => {
    expect(isUsername('abc')).toBe(true);
    expect(isUsername('User_123')).toBe(true);
    expect(isUsername('a'.repeat(30))).toBe(true);
  });

  it('rejects too short, too long or illegal characters', () => {
    expect(isUsername('ab')).toBe(false);
    expect(isUsername('a'.repeat(31))).toBe(false);
    expect(isUsername('has space')).toBe(false);
    expect(isUsername('dash-not-ok')).toBe(false);
  });
});

describe('classifyIdentifier', () => {
  it('detects an email', () => {
    expect(classifyIdentifier('Me@Example.com')).toEqual({
      kind: 'email',
      value: 'Me@Example.com',
    });
  });

  it('lowercases a username', () => {
    expect(classifyIdentifier('BobDylan')).toEqual({
      kind: 'username',
      value: 'bobdylan',
    });
  });

  it('flags anything else as invalid', () => {
    expect(classifyIdentifier('a b').kind).toBe('invalid');
  });
});

describe('validateRegistration', () => {
  const ok = {
    username: 'valid_user',
    email: 'user@example.com',
    password: 'longenough',
    confirm: 'longenough',
  };

  it('returns null when everything is valid', () => {
    expect(validateRegistration(ok)).toBeNull();
  });

  it('rejects a bad username first', () => {
    expect(validateRegistration({ ...ok, username: 'no' })).toBe(
      'auth.errors.invalidUsername',
    );
  });

  it('rejects a bad email', () => {
    expect(validateRegistration({ ...ok, email: 'nope' })).toBe(
      'auth.errors.invalidEmail',
    );
  });

  it('rejects a short password', () => {
    expect(validateRegistration({ ...ok, password: 'x'.repeat(MIN_PASSWORD_LENGTH - 1) })).toBe(
      'auth.errors.weakPassword',
    );
  });

  it('rejects a password/confirm mismatch', () => {
    expect(validateRegistration({ ...ok, confirm: 'different' })).toBe(
      'auth.errors.passwordMismatch',
    );
  });

  it('skips the confirm check when confirm is omitted', () => {
    const { confirm, ...noConfirm } = ok;
    void confirm;
    expect(validateRegistration(noConfirm)).toBeNull();
  });
});
