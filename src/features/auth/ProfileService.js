import { supabase } from '@/lib/supabaseClient';
import { AuthError } from './AuthError';

/**
 * Reads and writes `public.profiles`. RLS restricts row access to the owner;
 * the username-availability check uses a SECURITY DEFINER RPC so it works
 * before a user exists.
 */
export class ProfileService {
  constructor(client = supabase) {
    this.client = client;
  }

  /** The current user's profile, or null if the trigger hasn't run yet. */
  async getMyProfile() {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, username, display_name, locale, created_at')
      .maybeSingle();
    if (error) throw AuthError.from(error);
    return data ?? null;
  }

  async updateMyProfile(patch) {
    const { data, error } = await this.client
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .select('id, username, display_name, locale')
      .single();
    if (error) throw AuthError.from(error);
    return data;
  }

  /** True when the username can still be claimed. */
  async isUsernameAvailable(username) {
    const { data, error } = await this.client.rpc('username_available', {
      name: username.trim().toLowerCase(),
    });
    if (error) throw AuthError.from(error);
    return Boolean(data);
  }
}

export const profileService = new ProfileService();
