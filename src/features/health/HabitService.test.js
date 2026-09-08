import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HabitService } from './HabitService';

function makeChain(result) {
  const calls = {};
  const record = (name) =>
    vi.fn((...args) => {
      (calls[name] ||= []).push(args);
      return chain;
    });
  const promise = Promise.resolve(result);
  const chain = {
    calls,
    select: record('select'),
    insert: record('insert'),
    update: record('update'),
    delete: record('delete'),
    eq: record('eq'),
    order: record('order'),
    single: vi.fn(() => promise),
    then: (...a) => promise.then(...a),
  };
  return chain;
}

function makeClient({ session = { user: { id: 'u1' } }, result } = {}) {
  const chain = makeChain(result ?? { data: null, error: null });
  return {
    chain,
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
    from: vi.fn(() => chain),
  };
}

let client;
let service;

beforeEach(() => {
  client = makeClient();
  service = new HabitService(client);
});

describe('listHabits', () => {
  it('returns the current user rows, scoped and ordered', async () => {
    client = makeClient({ result: { data: [{ id: 'h1' }], error: null } });
    service = new HabitService(client);
    expect(await service.listHabits()).toEqual([{ id: 'h1' }]);
    expect(client.from).toHaveBeenCalledWith('user_habits');
    expect(client.chain.calls.eq).toEqual([['user_id', 'u1']]);
    expect(client.chain.calls.order[0][0]).toBe('sort_order');
  });

  it('returns [] when data is null', async () => {
    expect(await service.listHabits()).toEqual([]);
  });
});

describe('createHabit', () => {
  it('inserts the owner id and the name', async () => {
    client = makeClient({ result: { data: { id: 'h1' }, error: null } });
    service = new HabitService(client);
    await service.createHabit({ name: 'Walk 30 min' });
    expect(client.chain.calls.insert[0][0]).toEqual({ user_id: 'u1', name: 'Walk 30 min' });
  });
});

describe('updateHabit', () => {
  it('stamps updated_at and scopes by id + user', async () => {
    client = makeClient({ result: { data: { id: 'h1' }, error: null } });
    service = new HabitService(client);
    await service.updateHabit('h1', { is_active: false });
    expect(client.chain.calls.update[0][0]).toMatchObject({ is_active: false });
    expect(client.chain.calls.eq).toEqual([
      ['id', 'h1'],
      ['user_id', 'u1'],
    ]);
  });
});

describe('deleteHabit', () => {
  it('scopes the delete by id + user and returns the id', async () => {
    expect(await service.deleteHabit('h1')).toBe('h1');
    expect(client.chain.calls.delete).toHaveLength(1);
    expect(client.chain.calls.eq).toEqual([
      ['id', 'h1'],
      ['user_id', 'u1'],
    ]);
  });
});

describe('auth guard', () => {
  it('throws without a session', async () => {
    service = new HabitService(makeClient({ session: null }));
    await expect(service.listHabits()).rejects.toThrow('Not authenticated');
  });
});
