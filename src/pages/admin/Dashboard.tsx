import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: {
    id: string;
    userEmail: string;
    userName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<DashboardStats>('/api/admin/dashboard');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-[#f5e6c8] sm:text-4xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
          Panel de Administración
        </h1>
        <p className="mt-2 text-sm text-[#a89a82]">Gestiona tu tienda</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { label: 'Usuarios', value: stats?.totalUsers || 0, color: 'text-[#d4af37]' },
          { label: 'Productos', value: stats?.totalProducts || 0, color: 'text-[#f5e6c8]' },
          { label: 'Pedidos', value: stats?.totalOrders || 0, color: 'text-[#a89a82]' },
          { label: 'Ingresos', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, color: 'text-[#d4af37]' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#2a2520] bg-[#141210] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#a89a82]">{stat.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-10">
        <Link
          to="/administrador/productos"
          className="group rounded-xl border border-[#2a2520] bg-[#141210] p-6 transition-all hover:border-[#d4af37]/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d4af37]/10">
              <svg className="h-6 w-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f5e6c8]">Productos</h3>
              <p className="text-sm text-[#a89a82]">Crear, editar, eliminar</p>
            </div>
          </div>
          <div className="mt-4 text-xs uppercase tracking-[0.26em] text-[#d4af37] transition-all group-hover:translate-x-1">
            Gestionar →
          </div>
        </Link>

        <Link
          to="/administrador/pedidos"
          className="group rounded-xl border border-[#2a2520] bg-[#141210] p-6 transition-all hover:border-[#d4af37]/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d4af37]/10">
              <svg className="h-6 w-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f5e6c8]">Pedidos</h3>
              <p className="text-sm text-[#a89a82]">Ver y gestionar pedidos</p>
            </div>
          </div>
          <div className="mt-4 text-xs uppercase tracking-[0.26em] text-[#d4af37] transition-all group-hover:translate-x-1">
            Gestionar →
          </div>
        </Link>

        <Link
          to="/administrador/usuarios"
          className="group rounded-xl border border-[#2a2520] bg-[#141210] p-6 transition-all hover:border-[#d4af37]/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d4af37]/10">
              <svg className="h-6 w-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f5e6c8]">Usuarios</h3>
              <p className="text-sm text-[#a89a82]">Administrar usuarios</p>
            </div>
          </div>
          <div className="mt-4 text-xs uppercase tracking-[0.26em] text-[#d4af37] transition-all group-hover:translate-x-1">
            Gestionar →
          </div>
        </Link>
      </div>

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-6">
          <h2 className="text-lg font-semibold text-[#f5e6c8] mb-4">Pedidos Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2520]">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Total</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Estado</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2520]">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-[#f5e6c8]">{order.userName || order.userEmail}</td>
                    <td className="px-4 py-3 text-[#d4af37]">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        order.status === 'pagado' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                        order.status === 'enviado' ? 'bg-blue-500/10 text-blue-400' :
                        order.status === 'entregado' ? 'bg-green-500/10 text-green-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#a89a82]">
                      {new Date(order.createdAt).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
