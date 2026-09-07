import { supabase } from '@/lib/supabaseClient';

/**
 * Reads and writes `public.user_medications` — the per-user list of regular
 * medications shown as a checklist on the daily entry. RLS scopes rows to the
 * owner; queries also filter on `user_id` explicitly. Knows nothing about
 * React or Redux.
 */
const COLUMNS = 'id, name, dose, schedule, notes, is_active, sort_order, created_at';

export class MedicationService {
  constructor(client = supabase) {
    this.client = client;
  }

  async requireUserId() {
    const { data } = await this.client.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    return userId;
  }

  /** Every medication the user has configured, oldest first. */
  async listMedications() {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_medications')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** @param {{ name: string, dose?: string, schedule?: string, notes?: string }} values */
  async createMedication(values) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_medications')
      .insert({
        user_id: userId,
        name: values.name,
        dose: values.dose || null,
        schedule: values.schedule || null,
        notes: values.notes || null,
      })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async updateMedication(id, patch) {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_medications')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteMedication(id) {
    const userId = await this.requireUserId();
    const { error } = await this.client
      .from('user_medications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return id;
  }
}

export const medicationService = new MedicationService();
