/**
 * Reads and validates the environment configuration exactly once.
 * Fails loudly at startup instead of producing confusing runtime errors later.
 */

function required(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy .env.example to .env and fill it in.',
    );
  }
  return value;
}

export const env = Object.freeze({
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  siteUrl: import.meta.env.VITE_SITE_URL || window.location.origin,
});
