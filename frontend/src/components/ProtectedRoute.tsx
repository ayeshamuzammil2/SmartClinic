import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { roleHome } from '../utils';
import Spinner from './Spinner';

/** Requires authentication; redirects to /login otherwise. */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner block size={32} label="Loading SmartClinic…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

/** Role-gated variant: mismatched roles are sent to their own dashboard. */
export function RoleRoute({ role }: { role: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}
