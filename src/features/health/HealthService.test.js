import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HealthService } from './HealthService';

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
    upsert: record('upsert'),
    delete: record('delete'),
    eq: record('eq'),
    gte: record('gte'),
    lte: record('lte'),
    order: record('order'),
    maybeSingle: vi.fn(() => promise),
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
  service = new HealthService(client);
});

describe('requireUserId', () => {
  it('throws when there is no session', async () => {
    service = new HealthService(makeClient({ session: null }));
    await expect(service.requireUserId()).rejects.toThrow('Not authenticated');
  });
});

describe('getEntryByDate', () => {
  it('scopes by user_id and entry_date and returns null when empty', async () => {
    client = makeClient({ result: { data: null, error: null } });
    service = new HealthService(client);
    expect(await service.getEntryByDate('2026-01-02')).toBeNull();
    expect(client.from).toHaveBeenCalledWith('health_entries');
    expect(client.chain.calls.eq).toEqual([
      ['user_id', 'u1'],
      ['entry_date', '2026-01-02'],
    ]);
  });

  it('returns the row when present', async () => {
    const row = { entry_date: '2026-01-02', pain_level: 3, data: {} };
    client = makeClient({ result: { data: row, error: null } });
    service = new HealthService(client);
    expect(await service.getEntryByDate('2026-01-02')).toEqual(row);
  });

  it('throws on a query error', async () => {
    client = makeClient({ result: { data: null, error: new Error('db') } });
    service = new HealthService(client);
    await expect(service.getEntryByDate('2026-01-02')).rejects.toThrow('db');
  });
});

describe('listEntries', () => {
  it('filters to an inclusive date range for the current user', async () => {
    client = makeClient({ result: { data: [{ entry_date: '2026-01-02' }], error: null } });
    service = new HealthService(client);
    const rows = await service.listEntries('2026-01-01', '2026-01-31');
    expect(rows).toHaveLength(1);
    expect(client.chain.calls.eq).toEqual([['user_id', 'u1']]);
    expect(client.chain.calls.gte).toEqual([['entry_date', '2026-01-01']]);
    expect(client.chain.calls.lte).toEqual([['entry_date', '2026-01-31']]);
    expect(client.chain.calls.order[0][0]).toBe('entry_date');
  });
});

describe('saveEntry', () => {
  it('upserts a row that carries both the legacy columns and the data document', async () => {
    client = makeClient({ result: { data: { id: 'e1' }, error: null } });
    service = new HealthService(client);
    const values = {
      painLevel: 4,
      sleepHours: 7.5,
      sleepQuality: 'good',
      sleepNote: 'ok',
      data: { symptoms: { painLevel: '4' } },
    };
    await service.saveEntry('2026-01-02', values);

    const [row, opts] = client.chain.calls.upsert[0];
    expect(row).toMatchObject({
      user_id: 'u1',
      entry_date: '2026-01-02',
      pain_level: 4,
      sleep_hours: 7.5,
      sleep_quality: 'good',
      sleep_note: 'ok',
      data: { symptoms: { painLevel: '4' } },
    });
    expect(typeof row.updated_at).toBe('string');
    expect(opts).toEqual({ onConflict: 'user_id,entry_date' });
  });

  it('defaults data to an empty object', async () => {
    client = makeClient({ result: { data: {}, error: null } });
    service = new HealthService(client);
    await service.saveEntry('2026-01-02', { painLevel: null });
    expect(client.chain.calls.upsert[0][0].data).toEqual({});
  });
});
