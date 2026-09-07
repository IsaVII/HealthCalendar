import { createAsyncThunk } from '@reduxjs/toolkit';

import { authService } from './AuthService';
import { profileService } from './ProfileService';
import { AuthError } from './AuthError';

/** Wrap a service call so the rejected payload is always a plain {code,message}. */
function withAuthError(fn) {
  return async (arg, thunkApi) => {
    try {
      return await fn(arg, thunkApi);
    } catch (err) {
      return thunkApi.rejectWithValue(AuthError.from(err).toJSON());
    }
  };
}

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  withAuthError(async ({ username, email, password }) => {
    const available = await profileService.isUsernameAvailable(username);
    if (!available) throw new AuthError('usernameTaken', 'Username taken');
    await authService.signUp({ username, email, password });
    return { email };
  }),
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  withAuthError(async ({ identifier, password }) => {
    const { session, user } = await authService.signIn({ identifier, password });
    return { session, user };
  }),
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  withAuthError(async () => {
    await authService.signOut();
  }),
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  withAuthError(async (email) => {
    await authService.resendVerification(email);
  }),
);

export const loadMyProfile = createAsyncThunk(
  'auth/loadMyProfile',
  withAuthError(async () => {
    return await profileService.getMyProfile();
  }),
);

export const updateMyProfile = createAsyncThunk(
  'auth/updateMyProfile',
  withAuthError(async (patch) => {
    return await profileService.updateMyProfile(patch);
  }),
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  withAuthError(async (email) => {
    await authService.requestPasswordReset(email);
  }),
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  withAuthError(async (newPassword) => {
    await authService.updatePassword(newPassword);
  }),
);
