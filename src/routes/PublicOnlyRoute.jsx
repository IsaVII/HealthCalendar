import { Navigate, Outlet } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { selectIsInitializing, selectIsAuthenticated } from '@/features/auth/authSelectors';
import { FullPageSpinner } from '@/components/ui/FullPageSpinner';

/** For /login, /register etc. Sends already-authenticated users to the app. */
export function PublicOnlyRoute() {
  const initializing = useAppSelector(selectIsInitializing);
  const authenticated = useAppSelector(selectIsAuthenticated);

  if (initializing) return <FullPageSpinner />;
  if (authenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
