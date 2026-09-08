import { supabase } from '@/lib/supabaseClient';

/**
 * Reads and writes `public.health_entries`. RLS already restricts every row to
 * its owner; the queries below *also* filter on `user_id` explicitly, so a
 * `.maybeSingle()` can never trip over another user's row if RLS is ever
 * misconfigured. Knows nothing about React or Redux.
 *
 * Exposed as a singleton (`healthService`); the class stays testable with a
 * mock client.
 */
const COLUMNS =
  'id, entry_date, pain_level, sleep_hours, sleep_quality, sleep_note, data, created_at, updated_at';

export class HealthService {
  constructor(client = supabase) {
    this.client = client;
  }

  /** The signed-in user's id. Throws when there is no session. */
  async requireUserId() {
    const { data } = await this.client.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    return userId;
  }

  /**
   * The current user's entry for a given `YYYY-MM-DD` date, or null when they
   * haven't logged that day yet.
   */
  async getEntryByDate(date) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('health_entries')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('entry_date', date)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  /**
   * The current user's most recent entry strictly before `date`, or null. Used
   * to prefill "same as yesterday" fields (weight, height) on a fresh day.
   */
  async getEntryBefore(date) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('health_entries')
      .select(COLUMNS)
      .eq('user_id', userId)
      .lt('entry_date', date)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  /**
   * The current user's entries between two `YYYY-MM-DD` dates (inclusive),
   * oldest first. Used by the calendar overview.
   */
  async listEntries(fromDate, toDate) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('health_entries')
      .select('entry_date, pain_level, sleep_hours, sleep_quality')
      .eq('user_id', userId)
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
   * @param {{ painLevel: number|null, sleepHours: number|null, sleepQuality: string|null, sleepNote: string|null, data: object }} values
   */
  async saveEntry(date, values) {
    const userId = await this.requireUserId();

    const row = {
      user_id: userId,
      entry_date: date,
      pain_level: values.painLevel,
      sleep_hours: values.sleepHours,
      sleep_quality: values.sleepQuality,
      sleep_note: values.sleepNote,
      data: values.data ?? {},
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
