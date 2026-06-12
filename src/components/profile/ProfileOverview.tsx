import { Link } from 'react-router-dom';
import type { UserOrderStats } from '../../utils/orderStats';
import { formatDateTime, formatEuro, shortOrderId, statusBadgeClass, statusLabel } from '../../utils/orderUi';

export interface ProfileOrderSummary {
  id: string;
  total: number;
  status: string;
  createdAt: string;
}

interface UserProfileData {
  nombre: string;
  email: string;
  phone?: string;
  address?: {
    calle?: string;
    ciudad?: string;
  };
}

interface ProfileOverviewProps {
  profile: UserProfileData | null;
  stats: UserOrderStats;
  recentOrders: ProfileOrderSummary[];
  ordersLoading: boolean;
  onGoToOrders: () => void;
  onViewOrder: (orderId: string) => void;
}

export default function ProfileOverview({
  profile,
  stats,
  recentOrders,
  ordersLoading,
  onGoToOrders,
  onViewOrder,
}: ProfileOverviewProps) {
  return (
    <div className="space-y-6" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      <div>
        <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
          Resumen
        </h1>
        <p className="text-[#a89a82] text-sm mt-1">
          Bienvenido de nuevo{profile?.nombre ? `, ${profile.nombre}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-5 hover:border-[#d4af37]/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xs text-[#a89a82] uppercase tracking-wider">Pedidos</span>
          </div>
          <p className="text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            {ordersLoading ? '…' : stats.orderCount}
          </p>
        </div>

        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-5 hover:border-[#d4af37]/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-[#a89a82] uppercase tracking-wider">Pendientes</span>
          </div>
          <p className="text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            {ordersLoading ? '…' : stats.pendingOrders}
          </p>
        </div>

        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-5 hover:border-[#d4af37]/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-[#a89a82] uppercase tracking-wider">Gastado</span>
          </div>
          <p className="text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            {ordersLoading ? '…' : formatEuro(stats.totalSpent)}
          </p>
        </div>
      </div>

      {profile && (
        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#d4af37] uppercase tracking-wider mb-4" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            Datos Personales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#a89a82] uppercase tracking-wider">Nombre</p>
              <p className="text-sm text-[#f5e6c8] mt-1">{profile.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-[#a89a82] uppercase tracking-wider">Email</p>
              <p className="text-sm text-[#f5e6c8] mt-1">{profile.email}</p>
            </div>
            {profile.phone && (
              <div>
                <p className="text-xs text-[#a89a82] uppercase tracking-wider">Teléfono</p>
                <p className="text-sm text-[#f5e6c8] mt-1">{profile.phone}</p>
              </div>
            )}
            {profile.address?.calle && (
              <div>
                <p className="text-xs text-[#a89a82] uppercase tracking-wider">Dirección</p>
                <p className="text-sm text-[#f5e6c8] mt-1">
                  {profile.address.calle}{profile.address.ciudad ? `, ${profile.address.ciudad}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {recentOrders.length > 0 ? (
        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-semibold text-[#d4af37] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
              Últimos pedidos
            </h3>
            <button
              type="button"
              onClick={onGoToOrders}
              className="text-xs uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8] transition-colors"
            >
              Ver todos
            </button>
          </div>
          <ul className="divide-y divide-[#2a2520]">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => onViewOrder(order.id)}
                  className="w-full flex items-center justify-between gap-4 py-3 text-left hover:bg-[#1e1b18]/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f5e6c8]">{shortOrderId(order.id)}</p>
                    <p className="text-xs text-[#a89a82]">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${statusBadgeClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-sm font-semibold text-[#d4af37] tabular-nums">{formatEuro(order.total)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : !ordersLoading && stats.orderCount === 0 ? (
        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e1b18] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#a89a82]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#f5e6c8] mb-2" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            Aún no hay pedidos
          </h3>
          <p className="text-sm text-[#a89a82] max-w-sm mx-auto mb-6">
            Explora nuestra colección y encuentra algo que te encante. Tus pedidos aparecerán aquí.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#d4af37] text-[#0a0a0a] font-bold uppercase tracking-wider text-sm hover:bg-[#b8962e] transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      ) : null}
    </div>
  );
}
