import { supabase } from '@/lib/supabaseClient';
import { AuthError } from './AuthError';

// Columns we read/write on `profiles`. The optional ones arrived in later
// migrations (0008 unit_system, 0009 weather_*); on a database where those
// haven't been applied yet PostgREST answers with error 42703 (undefined
// column) and we retry without them so the rest of the profile still works.
const CORE_COLUMNS =
  'id, username, display_name, locale, default_height_cm, hidden_health_fields';
const OPTIONAL_COLUMNS = ['unit_system', 'weather_location', 'weather_lat', 'weather_lon'];

const isUndefinedColumn = (error) =>
  error?.code === '42703' || /column .* does not exist/i.test(error?.message ?? '');

/**
 * Reads and writes `public.profiles`. RLS restricts row access to the owner;
 * the username-availability check uses a SECURITY DEFINER RPC so it works
 * before a user exists.
 */
export class ProfileService {
  constructor(client = supabase) {
    this.client = client;
  }

  /** The signed-in user's id, or null. */
  async currentUserId() {
    const { data } = await this.client.auth.getSession();
    return data.session?.user?.id ?? null;
  }

  /** The current user's profile, or null if the trigger hasn't run yet. */
  async getMyProfile() {
    const userId = await this.currentUserId();
    if (!userId) return null;

    const run = (columns) =>
      this.client.from('profiles').select(columns).eq('id', userId).maybeSingle();

    let { data, error } = await run(
      `${CORE_COLUMNS}, ${OPTIONAL_COLUMNS.join(', ')}, created_at`,
    );
    if (error && isUndefinedColumn(error)) {
      ({ data, error } = await run(`${CORE_COLUMNS}, created_at`));
    }
    if (error) throw AuthError.from(error);
    return data ?? null;
  }

  async updateMyProfile(patch) {
    const userId = await this.currentUserId();
    if (!userId) throw new AuthError('generic', 'Not authenticated');

    const body = { ...patch, updated_at: new Date().toISOString() };
    const run = (columns) =>
      this.client.from('profiles').update(body).eq('id', userId).select(columns).single();

    let { data, error } = await run(`${CORE_COLUMNS}, ${OPTIONAL_COLUMNS.join(', ')}`);
    if (error && isUndefinedColumn(error)) {
      // Drop columns the DB doesn't know yet from both the write and the read-back.
      for (const col of OPTIONAL_COLUMNS) delete body[col];
      ({ data, error } = await run(CORE_COLUMNS));
    }
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
