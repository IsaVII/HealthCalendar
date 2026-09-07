import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthService } from './AuthService';
import { AuthError } from './AuthError';

function makeClient(overrides = {}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resend: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      ...overrides.auth,
    },
    rpc: vi.fn().mockResolvedValue({ data: 'found@example.com', error: null }),
    ...overrides,
  };
}

let client;
let service;

beforeEach(() => {
  client = makeClient();
  service = new AuthService(client);
});

describe('getSession', () => {
  it('returns the session or null', async () => {
    expect(await service.getSession()).toBeNull();
    client.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    expect(await service.getSession()).toEqual({ user: { id: 'u1' } });
  });

  it('throws an AuthError on failure', async () => {
    client.auth.getSession.mockResolvedValueOnce({
      data: {},
      error: { message: 'boom' },
    });
    await expect(service.getSession()).rejects.toBeInstanceOf(AuthError);
  });
});

describe('onAuthStateChange', () => {
  it('normalises undefined sessions to null and returns an unsubscribe', () => {
    const cb = vi.fn();
    const unsub = service.onAuthStateChange(cb);
    const handler = client.auth.onAuthStateChange.mock.calls[0][0];
    handler('SIGNED_IN', undefined);
    expect(cb).toHaveBeenCalledWith(null);
    unsub();
    expect(client.auth.onAuthStateChange.mock.results[0].value.data.subscription.unsubscribe)
      .toHaveBeenCalled();
  });
});

describe('signUp', () => {
  it('lowercases the username into user metadata and trims the email', async () => {
    await service.signUp({ username: '  Bob ', email: '  bob@x.io ', password: 'secretpw1' });
    const arg = client.auth.signUp.mock.calls[0][0];
    expect(arg.email).toBe('bob@x.io');
    expect(arg.options.data).toEqual({ username: 'bob' });
    expect(arg.options.emailRedirectTo).toContain('/verify-email');
  });

  it('maps a duplicate registration to usernameTaken', async () => {
    client.auth.signUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already registered' },
    });
    await expect(
      service.signUp({ username: 'bob', email: 'bob@x.io', password: 'secretpw1' }),
    ).rejects.toMatchObject({ code: 'usernameTaken' });
  });
});

describe('signIn', () => {
  it('signs in directly when given an email', async () => {
    await service.signIn({ identifier: 'bob@x.io', password: 'pw' });
    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'bob@x.io',
      password: 'pw',
    });
  });

  it('resolves a username to an email via RPC first', async () => {
    await service.signIn({ identifier: 'BobDylan', password: 'pw' });
    expect(client.rpc).toHaveBeenCalledWith('email_for_identifier', {
      identifier: 'bobdylan',
    });
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'found@example.com',
      password: 'pw',
    });
  });

  it('rejects a malformed identifier without hitting the network', async () => {
    await expect(
      service.signIn({ identifier: 'not valid', password: 'pw' }),
    ).rejects.toMatchObject({ code: 'invalidCredentials' });
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('throws usernameNotFound when the RPC returns nothing', async () => {
    client.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(
      service.signIn({ identifier: 'ghost', password: 'pw' }),
    ).rejects.toMatchObject({ code: 'usernameNotFound' });
  });

  it('maps bad credentials from Supabase', async () => {
    client.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    await expect(
      service.signIn({ identifier: 'bob@x.io', password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'invalidCredentials' });
  });
});

describe('the remaining passthrough calls', () => {
  it('signOut / resendVerification / requestPasswordReset / updatePassword succeed', async () => {
    await expect(service.signOut()).resolves.toBeUndefined();
    await service.resendVerification(' a@b.co ');
    expect(client.auth.resend.mock.calls[0][0]).toMatchObject({ type: 'signup', email: 'a@b.co' });
    await service.requestPasswordReset(' a@b.co ');
    expect(client.auth.resetPasswordForEmail.mock.calls[0][0]).toBe('a@b.co');
    await service.updatePassword('newpassword1');
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword1' });
  });

  it('propagates an error from signOut', async () => {
    client.auth.signOut.mockResolvedValueOnce({ error: { message: 'nope' } });
    await expect(service.signOut()).rejects.toBeInstanceOf(AuthError);
  });
});
