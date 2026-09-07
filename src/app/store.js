import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // health: healthReducer,  <-- added here when health features land
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
