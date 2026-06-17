import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');

export const AppShell = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const currentUser = useAuthStore((state) => state.currentUser);
  const { can, isAdmin } = usePermissions();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-6">
          <div className="mb-8 rounded-2xl bg-slate-900 px-4 py-4 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              SurveyPro
            </p>
            <h1 className="mt-2 text-xl font-semibold">RBAC Console</h1>
            <p className="mt-2 text-sm text-slate-300">{currentUser?.email}</p>
            <p className="mt-1 text-xs text-slate-400">{currentUser?.role}</p>
          </div>

          <nav className="space-y-1">
            <NavLink to="/surveys" className={navLinkClass}>
              Enquêtes
            </NavLink>
            {can('users:read') && (
              <NavLink to="/users" className={navLinkClass}>
                Utilisateurs
              </NavLink>
            )}
            {isAdmin && (
              <>
                <NavLink to="/branding" className={navLinkClass}>
                  Branding
                </NavLink>
                <NavLink to="/automations" className={navLinkClass}>
                  Automatisations
                </NavLink>
                <NavLink to="/webhooks" className={navLinkClass}>
                  Webhooks
                </NavLink>
              </>
            )}
          </nav>

          <div className="mt-8 border-t border-slate-200 pt-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Se déconnecter
            </button>
          </div>
        </aside>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
