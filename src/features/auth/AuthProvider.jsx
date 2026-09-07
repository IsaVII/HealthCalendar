import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { authService } from './AuthService';
import { sessionChanged, loadMyProfile } from './authSlice';

/**
 * Bridges Supabase's auth events into Redux. Mount once, near the root.
 * Renders its children unchanged.
 */
export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    let unsub = () => {};

    (async () => {
      const session = await authService.getSession().catch(() => null);
      dispatch(sessionChanged(session));
      if (session?.user?.email_confirmed_at) dispatch(loadMyProfile());

      unsub = authService.onAuthStateChange((next) => {
        dispatch(sessionChanged(next));
        if (next?.user?.email_confirmed_at) dispatch(loadMyProfile());
      });
    })();

    return () => unsub();
  }, [dispatch]);

  return children;
}
