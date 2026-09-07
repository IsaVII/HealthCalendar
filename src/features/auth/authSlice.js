import { createSlice } from '@reduxjs/toolkit';

import {
  registerUser,
  loginUser,
  logoutUser,
  resendVerification,
  loadMyProfile,
  updateMyProfile,
  requestPasswordReset,
  resetPassword,
} from './authThunks';

/**
 * status:
 *   'initializing'    – AuthProvider hasn't reported the first session yet
 *   'anonymous'       – no session
 *   'unverified'      – session exists but email not confirmed
 *   'authenticated'   – session + confirmed email
 */
const initialState = {
  status: 'initializing',
  session: null,
  user: null,
  profile: null,
  error: null,
  pending: false, // a form-level async action is in flight
};

function deriveStatus(session) {
  if (!session) return 'anonymous';
  return session.user?.email_confirmed_at ? 'authenticated' : 'unverified';
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called by AuthProvider whenever Supabase emits an auth event. */
    sessionChanged(state, action) {
      const session = action.payload;
      state.session = session;
      state.user = session?.user ?? null;
      state.status = deriveStatus(session);
      if (!session) state.profile = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pendingMatcher = (action) =>
      action.type.startsWith('auth/') && action.type.endsWith('/pending');
    const settledMatcher = (action) =>
      action.type.startsWith('auth/') &&
      (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected'));

    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.status = deriveStatus(action.payload.session);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.session = null;
        state.user = null;
        state.profile = null;
        state.status = 'anonymous';
      })
      .addCase(loadMyProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.profile = { ...state.profile, ...action.payload };
      })
      .addMatcher(pendingMatcher, (state) => {
        state.pending = true;
        state.error = null;
      })
      .addMatcher(settledMatcher, (state, action) => {
        state.pending = false;
        if (action.type.endsWith('/rejected')) {
          state.error = action.payload ?? { code: 'generic', message: 'Error' };
        }
      });
  },
});

// keep the thunks re-exported from here for convenient feature-level imports
export {
  registerUser,
  loginUser,
  logoutUser,
  resendVerification,
  loadMyProfile,
  updateMyProfile,
  requestPasswordReset,
  resetPassword,
};

export const { sessionChanged, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
