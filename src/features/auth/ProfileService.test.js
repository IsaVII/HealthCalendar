import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ProfileService } from './ProfileService';
import { AuthError } from './AuthError';

function makeChain(result) {
  const calls = { select: [], update: [], eq: [] };
  const chain = {
    calls,
    select: vi.fn((cols) => (calls.select.push(cols), chain)),
    update: vi.fn((patch) => (calls.update.push(patch), chain)),
    eq: vi.fn((col, val) => (calls.eq.push([col, val]), chain)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
  };
  return chain;
}

function makeClient({ session = { user: { id: 'u1' } }, result, rpc } = {}) {
  const chain = makeChain(result ?? { data: null, error: null });
  return {
    chain,
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
    from: vi.fn(() => chain),
    rpc: vi.fn().mockResolvedValue(rpc ?? { data: true, error: null }),
  };
}

let client;
let service;

beforeEach(() => {
  client = makeClient();
  service = new ProfileService(client);
});

describe('currentUserId', () => {
  it('returns the id, or null with no session', async () => {
    expect(await service.currentUserId()).toBe('u1');
    service = new ProfileService(makeClient({ session: null }));
    expect(await service.currentUserId()).toBeNull();
  });
});

describe('getMyProfile', () => {
  it('returns null when unauthenticated', async () => {
    service = new ProfileService(makeClient({ session: null }));
    expect(await service.getMyProfile()).toBeNull();
  });

  it('selects the new profile columns and scopes by id', async () => {
    client = makeClient({ result: { data: { id: 'u1', username: 'bob' }, error: null } });
    service = new ProfileService(client);
    const profile = await service.getMyProfile();
    expect(profile).toEqual({ id: 'u1', username: 'bob' });
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(client.chain.calls.select[0]).toContain('default_height_cm');
    expect(client.chain.calls.select[0]).toContain('hidden_health_fields');
    expect(client.chain.calls.eq[0]).toEqual(['id', 'u1']);
  });

  it('wraps a query error as an AuthError', async () => {
    client = makeClient({ result: { data: null, error: { message: 'db down' } } });
    service = new ProfileService(client);
    await expect(service.getMyProfile()).rejects.toBeInstanceOf(AuthError);
  });
});

describe('updateMyProfile', () => {
  it('stamps updated_at and scopes the update by id', async () => {
    client = makeClient({ result: { data: { id: 'u1' }, error: null } });
    service = new ProfileService(client);
    await service.updateMyProfile({ hidden_health_fields: ['meals'] });
    const patch = client.chain.calls.update[0];
    expect(patch.hidden_health_fields).toEqual(['meals']);
    expect(typeof patch.updated_at).toBe('string');
    expect(client.chain.calls.eq[0]).toEqual(['id', 'u1']);
  });

  it('throws when there is no session', async () => {
    service = new ProfileService(makeClient({ session: null }));
    await expect(service.updateMyProfile({})).rejects.toBeInstanceOf(AuthError);
  });
});

describe('isUsernameAvailable', () => {
  it('normalises the name and returns the RPC boolean', async () => {
    expect(await service.isUsernameAvailable('  BoB ')).toBe(true);
    expect(client.rpc).toHaveBeenCalledWith('username_available', { name: 'bob' });
  });
});
