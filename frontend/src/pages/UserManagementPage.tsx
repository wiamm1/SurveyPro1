import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserListItem } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'analyst' | 'viewer'>(
    'viewer'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/403', { replace: true });
      return;
    }

    const loadUsers = async () => {
      try {
        setLoading(true);
        setUsers(await userService.listUsers());
      } catch {
        setError('Impossible de charger les utilisateurs.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin, navigate]);

  const selfId = currentUser?.id;

  const refreshUsers = async () => {
    setUsers(await userService.listUsers());
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await userService.inviteUser({ email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteRole('viewer');
      await refreshUsers();
    } catch (error) {
      setError('Invitation impossible.');
      console.error(error);
    }
  };

  const handleRoleChange = async (
    userId: number,
    role: 'admin' | 'analyst' | 'viewer'
  ) => {
    if (userId === selfId) return;
    await userService.updateUserRole(userId, { role });
    await refreshUsers();
  };

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    if (userId === selfId) return;
    await userService.updateUserStatus(userId, { is_active: isActive });
    await refreshUsers();
  };

  const handleDelete = async (userId: number) => {
    if (userId === selfId) return;
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    await userService.deleteUser(userId);
    await refreshUsers();
  };

  const tableRows = useMemo(() => users, [users]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-slate-500">
            Invitations, rôles et statuts de votre company.
          </p>
        </div>
        <button
          onClick={() => navigate('/surveys')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Retour
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleInvite}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Email
            </span>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Rôle
            </span>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'admin' | 'analyst' | 'viewer')
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Inviter un utilisateur
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Chargement...
                </td>
              </tr>
            ) : (
              tableRows.map((user) => (
                <tr
                  key={user.id}
                  className={user.id === selfId ? 'bg-indigo-50/40' : ''}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={user.id === selfId}
                      onChange={(e) =>
                        handleRoleChange(
                          user.id,
                          e.target.value as 'admin' | 'analyst' | 'viewer'
                        )
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={user.id === selfId}
                      onClick={() =>
                        handleToggleStatus(user.id, !user.is_active)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} disabled:cursor-not-allowed`}
                    >
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={user.id === selfId}
                      onClick={() => handleDelete(user.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        Les actions sur soi-même sont désactivées pour éviter de bloquer la
        company sans admin.
      </div>
    </div>
  );
};
