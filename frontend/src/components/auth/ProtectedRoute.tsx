import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../store/useAuthStore';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: UserRole;
};

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
