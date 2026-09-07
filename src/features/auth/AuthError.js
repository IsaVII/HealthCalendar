/**
 * Normalises the many shapes of Supabase / network errors into a single object
 * with a stable `code` that maps to an i18n key.
 */
export class AuthError extends Error {
  constructor(code, message, cause) {
    super(message || code);
    this.name = 'AuthError';
    this.code = code; // e.g. 'invalidCredentials' -> 'auth.errors.invalidCredentials'
    this.cause = cause;
  }

  get i18nKey() {
    return `auth.errors.${this.code}`;
  }

  /** Plain object safe to store in Redux. */
  toJSON() {
    return { code: this.code, message: this.message };
  }

  static from(error) {
    if (error instanceof AuthError) return error;

    const raw = error?.message || String(error || '');
    const msg = raw.toLowerCase();

    if (msg.includes('invalid login credentials')) {
      return new AuthError('invalidCredentials', raw, error);
    }
    if (msg.includes('email not confirmed')) {
      return new AuthError('emailNotConfirmed', raw, error);
    }
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return new AuthError('usernameTaken', raw, error);
    }
    if (msg.includes('password')) {
      return new AuthError('weakPassword', raw, error);
    }
    return new AuthError('generic', raw || 'Unknown error', error);
  }
}
