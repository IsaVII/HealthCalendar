import { supabase } from '@/lib/supabaseClient';

/**
 * Reads and writes `public.user_habits` — the per-user list of habits shown as
 * a checklist on the daily entry. RLS scopes rows to the owner; queries also
 * filter on `user_id` explicitly. Knows nothing about React or Redux.
 */
const COLUMNS = 'id, name, is_active, sort_order, created_at';

export class HabitService {
  constructor(client = supabase) {
    this.client = client;
  }

  async requireUserId() {
    const { data } = await this.client.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    return userId;
  }

  /** Every habit the user has configured, oldest first. */
  async listHabits() {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_habits')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** @param {{ name: string }} values */
  async createHabit(values) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_habits')
      .insert({ user_id: userId, name: values.name })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async updateHabit(id, patch) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_habits')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteHabit(id) {
    const userId = await this.requireUserId();
    const { error } = await this.client
      .from('user_habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return id;
  }
}

export const habitService = new HabitService();
