import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import {
  selectIsInitializing,
  selectIsAuthenticated,
  selectIsUnverified,
} from '@/features/auth/authSelectors';
import { FullPageSpinner } from '@/components/ui/FullPageSpinner';

/** Requires a session AND a confirmed email. */
export function ProtectedRoute() {
  const initializing = useAppSelector(selectIsInitializing);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const unverified = useAppSelector(selectIsUnverified);
  const location = useLocation();

  if (initializing) return <FullPageSpinner />;
  if (unverified) return <Navigate to="/verify-email" replace />;
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
