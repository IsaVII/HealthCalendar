/** The only sanctioned way for the UI to read auth state. */

export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthSession = (state) => state.auth.session;
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthProfile = (state) => state.auth.profile;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthPending = (state) => state.auth.pending;

/** Measurement system for the daily entry form: 'metric' | 'imperial'. */
export const selectUnitSystem = (state) =>
  state.auth.profile?.unit_system === 'imperial' ? 'imperial' : 'metric';

export const selectIsInitializing = (state) => state.auth.status === 'initializing';
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectIsUnverified = (state) => state.auth.status === 'unverified';

/** Best available display name: profile name -> username -> email local part. */
export const selectDisplayName = (state) => {
  const { profile, user } = state.auth;
  return (
    profile?.display_name ||
    profile?.username ||
    user?.email?.split('@')[0] ||
    ''
  );
};
