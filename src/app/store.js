import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/features/auth/authSlice';
import healthReducer from '@/features/health/healthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    health: healthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Supabase session objects are plain JSON, but be explicit about the
        // action that carries them.
        ignoredActions: ['auth/sessionChanged'],
        ignoredPaths: ['auth.session', 'auth.user'],
      },
    }),
});
