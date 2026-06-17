import { useAuthStore, type UserRole } from '../store/useAuthStore';

export const usePermissions = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  return {
    can: (permission: string) => hasPermission(permission),
    role: (currentUser?.role ?? null) as UserRole | null,
    isAdmin: hasRole('admin'),
    isAnalyst: hasRole('analyst'),
    isViewer: hasRole('viewer'),
  };
};
