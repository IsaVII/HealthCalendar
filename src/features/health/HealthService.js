import { supabase } from '@/lib/supabaseClient';

/**
 * Reads and writes `public.health_entries`. RLS restricts every row to its
 * owner, so these queries never need an explicit `user_id` filter on reads.
 * Knows nothing about React or Redux.
 *
 * Exposed as a singleton (`healthService`); the class stays testable with a
 * mock client.
 */
const COLUMNS = 'id, entry_date, pain_level, sleep_hours, sleep_quality, created_at, updated_at';

export class HealthService {
  constructor(client = supabase) {
    this.client = client;
  }

  /**
   * The current user's entry for a given `YYYY-MM-DD` date, or null when they
   * haven't logged that day yet.
   */
  async getEntryByDate(date) {
    const { data, error } = await this.client
      .from('health_entries')
      .select(COLUMNS)
      .eq('entry_date', date)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  /**
   * The current user's entries between two `YYYY-MM-DD` dates (inclusive),
   * oldest first. Used by the calendar overview.
   */
  async listEntries(fromDate, toDate) {
    const { data, error } = await this.client
      .from('health_entries')
      .select('entry_date, pain_level, sleep_hours, sleep_quality')
      .gte('entry_date', fromDate)
      .lte('entry_date', toDate)
      .order('entry_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Insert or update the current user's entry for `date`. Upserts on the
   * (user_id, entry_date) unique constraint, so calling it twice for the same
   * day edits the existing row rather than failing.
   *
   * @param {string} date  `YYYY-MM-DD`
   * @param {{ painLevel: number|null, sleepHours: number|null, sleepQuality: string|null }} values
   */
  async saveEntry(date, values) {
    const { data: sessionData } = await this.client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const row = {
      user_id: userId,
      entry_date: date,
      pain_level: values.painLevel,
      sleep_hours: values.sleepHours,
      sleep_quality: values.sleepQuality,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('health_entries')
      .upsert(row, { onConflict: 'user_id,entry_date' })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }
}

export const healthService = new HealthService();
