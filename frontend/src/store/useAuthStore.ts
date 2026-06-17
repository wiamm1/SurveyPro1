import { create } from 'zustand';

export type UserRole = 'admin' | 'analyst' | 'viewer';

export type AuthUser = {
  id?: number;
  email: string;
  name?: string | null;
  role: UserRole;
  companyId?: number | null;
  permissions: string[];
  isActive?: boolean;
};

type AuthState = {
  currentUser: AuthUser | null;
  token: string | null;
  setSession: (user: AuthUser, token: string) => void;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hydrateFromStorage: () => void;
};

const STORAGE_USER_KEY = 'user';
const STORAGE_TOKEN_KEY = 'token';
const STORAGE_PERMISSIONS_KEY = 'permissions';

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  token: null,
  setSession: (user, token) => {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(
      STORAGE_PERMISSIONS_KEY,
      JSON.stringify(user.permissions)
    );
    set({ currentUser: user, token });
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_PERMISSIONS_KEY);
    set({ currentUser: null, token: null });
  },
  hasPermission: (permission) => {
    const currentUser = get().currentUser;
    return Boolean(currentUser?.permissions.includes(permission));
  },
  hasRole: (role) => {
    const currentUser = get().currentUser;
    return currentUser?.role === role;
  },
  hydrateFromStorage: () => {
    const savedUser = safeJsonParse<AuthUser>(
      localStorage.getItem(STORAGE_USER_KEY)
    );
    const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const savedPermissions =
      safeJsonParse<string[]>(localStorage.getItem(STORAGE_PERMISSIONS_KEY)) ??
      [];

    if (savedUser && savedToken) {
      set({
        currentUser: {
          ...savedUser,
          permissions: savedUser.permissions?.length
            ? savedUser.permissions
            : savedPermissions,
        },
        token: savedToken,
      });
    }
  },
}));
