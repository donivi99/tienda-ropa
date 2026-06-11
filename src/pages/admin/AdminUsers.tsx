import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface AdminUser {
  uid: string;
  email: string;
  nombre: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: AdminUser[]; adminEmail: string }>('/api/admin/users');
      setUsers(data.users);
      setAdminEmail(data.adminEmail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid: string, role: string) => {
    try {
      setError('');
      await api.put(`/api/auth/users/${uid}/role`, { role });
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar rol';
      setError(message);
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
          Usuarios
        </h1>
        <p className="mt-1 text-sm text-[#a89a82]">{users.length} usuarios registrados</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2520] bg-[#141210]">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Usuario</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Email</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Rol</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Registro</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#a89a82]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2520]">
            {users.map((user) => {
              const isProtectedAdmin = user.email === adminEmail;
              return (
                <tr key={user.uid} className="hover:bg-[#141210]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37] text-sm font-semibold">
                        {user.nombre?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </div>
                      <p className="text-[#f5e6c8]">{user.nombre || 'Sin nombre'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-[#d4af37]/10 text-[#d4af37]'
                        : 'bg-[#2a2520] text-[#a89a82]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isProtectedAdmin ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2520] bg-[#1e1b18] px-3 py-1.5 text-xs text-[#a89a82] cursor-not-allowed">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Admin principal
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                        className="rounded-lg border border-[#2a2520] bg-[#1e1b18] px-3 py-1.5 text-xs text-[#f5e6c8] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
