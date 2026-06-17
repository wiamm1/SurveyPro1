import type { ReactNode } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

type RequirePermissionProps = {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
};

export const RequirePermission = ({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
