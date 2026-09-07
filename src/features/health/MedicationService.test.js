import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MedicationService } from './MedicationService';

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
  service = new MedicationService(client);
});

describe('listMedications', () => {
  it('returns the current user rows ordered by sort_order', async () => {
    client = makeClient({ result: { data: [{ id: 'm1' }], error: null } });
    service = new MedicationService(client);
    expect(await service.listMedications()).toEqual([{ id: 'm1' }]);
    expect(client.from).toHaveBeenCalledWith('user_medications');
    expect(client.chain.calls.eq).toEqual([['user_id', 'u1']]);
    expect(client.chain.calls.order[0][0]).toBe('sort_order');
  });

  it('returns [] when data is null', async () => {
    expect(await service.listMedications()).toEqual([]);
  });
});

describe('createMedication', () => {
  it('inserts the owner id and nulls empty optional fields', async () => {
    client = makeClient({ result: { data: { id: 'm1' }, error: null } });
    service = new MedicationService(client);
    await service.createMedication({ name: 'Aspirin', dose: '', schedule: 'daily' });
    expect(client.chain.calls.insert[0][0]).toEqual({
      user_id: 'u1',
      name: 'Aspirin',
      dose: null,
      schedule: 'daily',
      notes: null,
    });
  });
});

describe('updateMedication', () => {
  it('stamps updated_at and scopes by id + user', async () => {
    client = makeClient({ result: { data: { id: 'm1' }, error: null } });
    service = new MedicationService(client);
    await service.updateMedication('m1', { is_active: false });
    expect(client.chain.calls.update[0][0]).toMatchObject({ is_active: false });
    expect(client.chain.calls.eq).toEqual([
      ['id', 'm1'],
      ['user_id', 'u1'],
    ]);
  });
});

describe('deleteMedication', () => {
  it('deletes by id + user and echoes the id', async () => {
    client = makeClient({ result: { error: null } });
    service = new MedicationService(client);
    expect(await service.deleteMedication('m1')).toBe('m1');
    expect(client.chain.calls.eq).toEqual([
      ['id', 'm1'],
      ['user_id', 'u1'],
    ]);
  });

  it('throws on error', async () => {
    client = makeClient({ result: { error: new Error('nope') } });
    service = new MedicationService(client);
    await expect(service.deleteMedication('m1')).rejects.toThrow('nope');
  });
});

describe('requireUserId', () => {
  it('throws without a session', async () => {
    service = new MedicationService(makeClient({ session: null }));
    await expect(service.listMedications()).rejects.toThrow('Not authenticated');
  });
});
