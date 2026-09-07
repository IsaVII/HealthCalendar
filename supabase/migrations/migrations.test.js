import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const read = (f) => readFileSync(join(dir, f), 'utf8');

describe('migration files', () => {
  it('are named NNNN_snake_case.sql with strictly increasing numbers', () => {
    let last = -1;
    for (const f of files) {
      expect(f).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
      const n = Number(f.slice(0, 4));
      expect(n).toBeGreaterThan(last);
      last = n;
    }
  });

  it('every create table also enables RLS and defines policies', () => {
    for (const f of files) {
      const sql = read(f).toLowerCase();
      const tables = [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map(
        (m) => m[1],
      );
      for (const table of tables) {
        expect(sql, `${f}: RLS on ${table}`).toContain(
          `alter table public.${table} enable row level security`,
        );
        expect(sql, `${f}: a policy for ${table}`).toMatch(
          new RegExp(`create policy[^;]+on public\\.${table}`),
        );
        expect(sql, `${f}: owner check for ${table}`).toContain('auth.uid()');
      }
    }
  });

  it('0005 adds the health_entries.data jsonb column', () => {
    const sql = read('0005_health_entries_data.sql');
    expect(sql).toMatch(/add column if not exists data jsonb/i);
    expect(sql).toMatch(/jsonb_typeof\(data\) = 'object'/);
  });

  it('0006 creates user_medications and profiles.default_height_cm', () => {
    const sql = read('0006_user_medications.sql');
    expect(sql).toMatch(/create table if not exists public\.user_medications/i);
    expect(sql).toMatch(/schedule .*in\s*\(\s*'daily', 'morning', 'evening', 'night', 'as_needed'\)/is);
    expect(sql).toMatch(/add column if not exists default_height_cm numeric/i);
  });

  it('0007 adds profiles.hidden_health_fields as a jsonb array', () => {
    const sql = read('0007_profiles_hidden_health_fields.sql');
    expect(sql).toMatch(/add column if not exists hidden_health_fields jsonb not null default '\[\]'/i);
    expect(sql).toMatch(/jsonb_typeof\(hidden_health_fields\) = 'array'/);
  });

  it('each policy migration is idempotent (drop policy if exists before create)', () => {
    for (const f of files) {
      const sql = read(f).toLowerCase();
      const created = [...sql.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
      for (const name of created) {
        expect(sql, `${f}: drop-if-exists for "${name}"`).toContain(
          `drop policy if exists "${name}"`,
        );
      }
    }
  });
});
