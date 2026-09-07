/**
 * Pure client-side validation for the auth forms.
 * The database enforces the same username rule (see migration 0001).
 */

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function isEmail(value) {
  return EMAIL_RE.test(String(value).trim());
}

export function isUsername(value) {
  return USERNAME_RE.test(String(value).trim());
}

/** An identifier is "username or email"; classify which one it is. */
export function classifyIdentifier(value) {
  const v = String(value).trim();
  if (isEmail(v)) return { kind: 'email', value: v };
  if (isUsername(v)) return { kind: 'username', value: v.toLowerCase() };
  return { kind: 'invalid', value: v };
}

/** Returns an i18n error key, or null when valid. */
export function validateRegistration({ username, email, password, confirm }) {
  if (!isUsername(username)) return 'auth.errors.invalidUsername';
  if (!isEmail(email)) return 'auth.errors.invalidEmail';
  if (String(password).length < MIN_PASSWORD_LENGTH) return 'auth.errors.weakPassword';
  if (confirm !== undefined && password !== confirm) return 'auth.errors.passwordMismatch';
  return null;
}
