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
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await api.get<AdminUser[]>('/api/admin/users');
      setUsers(data);
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
      await api.put(`/api/auth/users/${uid}/role`, { role });
      fetchUsers();
    } catch (err) {
      console.error(err);
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
            {users.map((user) => (
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
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    className="rounded-lg border border-[#2a2520] bg-[#1e1b18] px-3 py-1.5 text-xs text-[#f5e6c8] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
