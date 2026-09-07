import { supabase } from '@/lib/supabaseClient';
import { env } from '@/config/env';
import { AuthError } from './AuthError';
import { classifyIdentifier } from './validation';

/**
 * All authentication operations. Talks to Supabase Auth and the auth-related
 * RPCs. Knows nothing about React or Redux.
 *
 * Exposed as a singleton (`authService`) so the rest of the app never
 * constructs it, but the class stays testable with a mock client.
 */
export class AuthService {
  constructor(client = supabase) {
    this.client = client;
  }

  /** Current session or null. */
  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw AuthError.from(error);
    return data.session ?? null;
  }

  /**
   * Subscribe to auth state changes.
   * @param {(session: object|null) => void} callback
   * @returns {() => void} unsubscribe
   */
  onAuthStateChange(callback) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      callback(session ?? null);
    });
    return () => data.subscription.unsubscribe();
  }

  /**
   * Register with email + password. `username` is stored in user metadata and
   * copied into `public.profiles` by a database trigger. Supabase sends the
   * confirmation email when "Confirm email" is enabled.
   */
  async signUp({ username, email, password }) {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim().toLowerCase() },
        emailRedirectTo: `${env.siteUrl}/verify-email`,
      },
    });
    if (error) throw AuthError.from(error);
    return data;
  }

  /**
   * Log in with either a username or an email address.
   * When given a username, resolve it to an email via the
   * `email_for_identifier` RPC first.
   */
  async signIn({ identifier, password }) {
    const parsed = classifyIdentifier(identifier);
    if (parsed.kind === 'invalid') {
      throw new AuthError('invalidCredentials', 'Malformed identifier');
    }

    let email = parsed.value;
    if (parsed.kind === 'username') {
      email = await this.resolveEmailForUsername(parsed.value);
    }

    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw AuthError.from(error);
    return data;
  }

  /** username -> email, via a SECURITY DEFINER RPC. Throws if not found. */
  async resolveEmailForUsername(username) {
    const { data, error } = await this.client.rpc('email_for_identifier', {
      identifier: username.trim().toLowerCase(),
    });
    if (error) throw AuthError.from(error);
    if (!data) throw new AuthError('usernameNotFound', 'No account for that username');
    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw AuthError.from(error);
  }

  /** Re-send the confirmation email. */
  async resendVerification(email) {
    const { error } = await this.client.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${env.siteUrl}/verify-email` },
    });
    if (error) throw AuthError.from(error);
  }

  async requestPasswordReset(email) {
    const { error } = await this.client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${env.siteUrl}/reset-password`,
    });
    if (error) throw AuthError.from(error);
  }

  async updatePassword(newPassword) {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw AuthError.from(error);
  }
}

export const authService = new AuthService();
