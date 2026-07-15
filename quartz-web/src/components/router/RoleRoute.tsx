import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/useAuthStore';
import type { UserRole } from '@/types/domain';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const role = useAuthStore((state) => state.sessionData?.user.role);
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};
