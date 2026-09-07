import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/**
 * The single Supabase client for the whole app.
 *
 * This is the ONLY module allowed to import from '@supabase/supabase-js'.
 * Everything else goes through a feature service (e.g. AuthService).
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // handle the ?code=... email-confirm redirect
  },
});
