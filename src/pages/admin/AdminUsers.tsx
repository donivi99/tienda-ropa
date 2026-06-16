import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminSelect, ORDER_STATUS_TONES } from '../../components/admin/AdminSelect';
import { api } from '../../services/api';
import { formatAddressDetails, formatStreetLine } from '../../utils/orderUi';
import { formatPendingOrdersLabel, isProtectedAdminEmail } from '../../constants/admin';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User', dotClass: 'bg-[#8a7d6a]' },
  {
    value: 'admin',
    label: 'Admin',
    toneClass: 'border-[#d4af37]/45 bg-[#d4af37]/14 text-[#e8c96a]',
    dotClass: 'bg-[#d4af37]',
  },
];

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const BUYER_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'with_orders', label: 'Con pedidos' },
  { value: 'no_orders', label: 'Sin compras' },
];

const SORT_OPTIONS = [
  { value: 'created-desc', label: 'Registro (recientes)' },
  { value: 'created-asc', label: 'Registro (antiguos)' },
  { value: 'spent-desc', label: 'Gasto (mayor)' },
  { value: 'orders-desc', label: 'Pedidos (más)' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
];

type BuyerFilter = 'all' | 'with_orders' | 'no_orders';
type SortKey = 'created-desc' | 'created-asc' | 'spent-desc' | 'orders-desc' | 'name-asc';

interface UserAddress {
  calle?: string;
  numero?: string;
  piso?: string;
  puerta?: string;
  portal?: string;
  escalera?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  referencias?: string;
}

interface UserOrderStats {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  pendingOrders: number;
}

interface AdminUser {
  uid: string;
  email: string;
  nombre: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  address?: UserAddress;
  stats?: UserOrderStats;
}

interface UserOrderPreview {
  id: string;
  total: number;
  status: string;
  createdAt: string;
}

interface UserDetail extends AdminUser {
  recentOrders: UserOrderPreview[];
}

const EMPTY_STATS: UserOrderStats = {
  orderCount: 0,
  totalSpent: 0,
  lastOrderAt: null,
  pendingOrders: 0,
};

function getUserStats(user: AdminUser): UserOrderStats {
  return user.stats ?? EMPTY_STATS;
}

function safeTime(iso?: string) {
  const t = iso ? new Date(iso).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isProfileIncomplete(user: AdminUser) {
  return !user.phone?.trim() || !user.address?.calle?.trim() || !user.address?.numero?.trim();
}

function statusBadgeClass(status: string) {
  return ORDER_STATUS_TONES[status] ?? 'border-[#2a2520] bg-[#1e1b18] text-[#a89a82]';
}

function formatAddressBlock(user: AdminUser) {
  const addr = user.address;
  if (!addr?.calle) return null;
  const lines = [formatStreetLine({ calle: addr.calle, numero: addr.numero ?? '' })];
  const details = formatAddressDetails(addr);
  if (details) lines.push(details);
  if (addr.codigoPostal || addr.ciudad) {
    lines.push(`${addr.codigoPostal ?? ''} ${addr.ciudad ?? ''}, ${addr.provincia ?? ''}`.trim());
  }
  if (addr.referencias?.trim()) lines.push(`Ref: ${addr.referencias.trim()}`);
  return lines.join('\n');
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBuyer, setFilterBuyer] = useState<BuyerFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created-desc');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      setLoadError('');
      const data = await api.get<{ users: AdminUser[]; adminEmail: string }>('/api/admin/users');
      setUsers(data.users);
      setAdminEmail(data.adminEmail);
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || filterRole !== '' || filterBuyer !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setFilterBuyer('all');
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = users.filter((user) => {
      const stats = getUserStats(user);
      if (filterRole && user.role !== filterRole) return false;
      if (filterBuyer === 'with_orders' && stats.orderCount === 0) return false;
      if (filterBuyer === 'no_orders' && stats.orderCount > 0) return false;
      if (q) {
        const inName = user.nombre?.toLowerCase().includes(q);
        const inEmail = user.email?.toLowerCase().includes(q);
        const inUid = user.uid.toLowerCase().includes(q);
        const inPhone = user.phone?.toLowerCase().includes(q);
        if (!inName && !inEmail && !inUid && !inPhone) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      const statsA = getUserStats(a);
      const statsB = getUserStats(b);
      switch (sortKey) {
        case 'created-asc':
          return safeTime(a.createdAt) - safeTime(b.createdAt);
        case 'spent-desc':
          return statsB.totalSpent - statsA.totalSpent;
        case 'orders-desc':
          return statsB.orderCount - statsA.orderCount;
        case 'name-asc':
          return (a.nombre || a.email).localeCompare(b.nombre || b.email, 'es');
        case 'created-desc':
        default:
          return safeTime(b.createdAt) - safeTime(a.createdAt);
      }
    });

    return result;
  }, [users, searchQuery, filterRole, filterBuyer, sortKey]);

  const summary = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const admins = users.filter((u) => u.role === 'admin').length;
    const buyers = users.filter((u) => getUserStats(u).orderCount > 0).length;
    const newThisWeek = users.filter((u) => safeTime(u.createdAt) >= weekAgo).length;
    return { admins, buyers, newThisWeek };
  }, [users]);

  const handleRoleChange = async (uid: string, role: string) => {
    try {
      setError('');
      await api.put(`/api/auth/users/${uid}/role`, { role });
      fetchUsers();
      if (detailUser?.uid === uid) {
        setDetailUser((prev) => (prev ? { ...prev, role } : prev));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar rol';
      setError(message);
      setTimeout(() => setError(''), 4000);
    }
  };

  const openDetail = async (uid: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setCopyMsg('');
    setDetailUser(null);

    try {
      const data = await api.get<UserDetail>(`/api/admin/users/${uid}`);
      setDetailUser(data);
    } catch {
      setDetailError('No se pudo cargar el detalle del usuario');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailUser(null);
    setDetailError('');
    setCopyMsg('');
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    document.addEventListener('keydown', onKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [detailOpen, closeDetail]);

  const copyUid = async () => {
    if (!detailUser) return;
    try {
      await navigator.clipboard.writeText(detailUser.uid);
      setCopyMsg('UID copiado');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('No se pudo copiar');
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
        <p className="mt-1 text-sm text-[#a89a82]">
          {filteredUsers.length === users.length
            ? `${users.length} usuarios registrados`
            : `${filteredUsers.length} de ${users.length} usuarios`}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[#f5e6c8]">{users.length}</p>
        </div>
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">Compradores</p>
          <p className="mt-1 text-2xl font-semibold text-[#d4af37]">{summary.buyers}</p>
        </div>
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">Administradores</p>
          <p className="mt-1 text-2xl font-semibold text-[#f5e6c8]">{summary.admins}</p>
        </div>
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">Nuevos (7 días)</p>
          <p className="mt-1 text-2xl font-semibold text-[#d4af37]">{summary.newThisWeek}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#2a2520] bg-[#141210] p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="user-search" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
              Buscar
            </label>
            <input
              id="user-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre, email, teléfono o UID..."
              className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-sm text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
          <AdminSelect
            id="filter-role"
            label="Rol"
            value={filterRole}
            onChange={setFilterRole}
            options={ROLE_FILTER_OPTIONS}
          />
          <AdminSelect
            id="filter-buyer"
            label="Actividad"
            value={filterBuyer}
            onChange={(v) => setFilterBuyer(v as BuyerFilter)}
            options={BUYER_FILTER_OPTIONS}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <AdminSelect
            id="sort-users"
            label="Ordenar por"
            value={sortKey}
            onChange={(v) => setSortKey(v as SortKey)}
            options={SORT_OPTIONS}
            className="min-w-[180px] flex-1 sm:max-w-xs"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/20 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      )}

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
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Pedidos</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Gastado</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Último pedido</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Registro</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#a89a82]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2520]">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#a89a82]">
                  {users.length === 0 ? 'No hay usuarios registrados' : 'Ningún usuario coincide con los filtros'}
                </td>
              </tr>
            )}
            {filteredUsers.map((user) => {
              const isProtectedAdmin = isProtectedAdminEmail(user.email, adminEmail);
              const stats = getUserStats(user);
              const isBuyer = stats.orderCount > 0;
              const incomplete = isProfileIncomplete(user);

              return (
                <tr
                  key={user.uid}
                  onClick={() => openDetail(user.uid)}
                  className="cursor-pointer transition-colors hover:bg-[#141210]/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 text-sm font-semibold text-[#d4af37]">
                        {user.nombre?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#f5e6c8]">{user.nombre || 'Sin nombre'}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {isBuyer ? (
                            <span className="rounded bg-[#d4af37]/10 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-[#d4af37]">
                              Comprador
                            </span>
                          ) : (
                            <span className="rounded bg-[#2a2520] px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-[#a89a82]">
                              Sin compras
                            </span>
                          )}
                          {incomplete && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-amber-400">
                              Perfil incompleto
                            </span>
                          )}
                          {stats.pendingOrders > 0 && (
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-blue-400">
                              {formatPendingOrdersLabel(stats.pendingOrders)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-[#d4af37]/10 text-[#d4af37]'
                          : 'bg-[#2a2520] text-[#a89a82]'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#f5e6c8]">{stats.orderCount}</td>
                  <td className="px-4 py-3 font-semibold text-[#d4af37]">
                    {stats.totalSpent.toFixed(2)}€
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">
                    {stats.lastOrderAt
                      ? new Date(stats.lastOrderAt).toLocaleDateString('es-ES')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">
                    {user.createdAt ? formatDateTime(user.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(user.uid)}
                        className="rounded-lg px-3 py-1.5 text-xs text-[#a89a82] transition-colors hover:bg-[#2a2520] hover:text-[#f5e6c8]"
                      >
                        Ver detalle
                      </button>
                      {isProtectedAdmin ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2520] bg-[#1e1b18] px-3 py-1.5 text-xs text-[#a89a82] cursor-not-allowed">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Protegido
                        </span>
                      ) : (
                        <AdminSelect
                          value={user.role}
                          onChange={(role) => handleRoleChange(user.uid, role)}
                          options={ROLE_OPTIONS}
                          variant="status"
                          size="compact"
                          className="inline-block min-w-[7rem]"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
          onClick={closeDetail}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#2a2520] bg-[#141210] shadow-[0_24px_80px_rgba(0,0,0,0.5)] outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#2a2520] px-6 py-5">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[#d4af37]">Detalle del usuario</p>
                <h2 id="user-detail-title" className="mt-1 text-xl font-semibold text-[#f5e6c8]">
                  {detailLoading
                    ? 'Cargando…'
                    : detailError
                      ? 'Error'
                      : detailUser?.nombre || 'Sin nombre'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-[#a89a82] transition-colors hover:bg-[#2a2520] hover:text-[#f5e6c8]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {detailLoading && (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
                </div>
              )}

              {detailError && !detailLoading && (
                <p className="py-8 text-center text-red-400">{detailError}</p>
              )}

              {detailUser && !detailLoading && (() => {
                const detailStats = getUserStats(detailUser);
                return (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4 sm:col-span-2">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">UID</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="break-all font-mono text-xs text-[#f5e6c8]">{detailUser.uid}</p>
                        <button
                          type="button"
                          onClick={copyUid}
                          className="shrink-0 text-[0.65rem] uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8]"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Email</p>
                      <p className="mt-1 text-sm text-[#f5e6c8]">{detailUser.email}</p>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Teléfono</p>
                      <p className="mt-1 text-sm text-[#f5e6c8]">{detailUser.phone || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Registro</p>
                      <p className="mt-1 text-sm text-[#f5e6c8]">
                        {detailUser.createdAt ? formatDateTime(detailUser.createdAt) : '—'}
                      </p>
                    </div>
                    {detailUser.updatedAt && (
                      <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Última actualización</p>
                        <p className="mt-1 text-sm text-[#f5e6c8]">{formatDateTime(detailUser.updatedAt)}</p>
                      </div>
                    )}
                  </div>

                  {formatAddressBlock(detailUser) && (
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Dirección guardada</p>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-[#f5e6c8]">
                        {formatAddressBlock(detailUser)}
                      </pre>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Pedidos</p>
                      <p className="mt-1 text-xl font-semibold text-[#f5e6c8]">{detailStats.orderCount}</p>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Total gastado</p>
                      <p className="mt-1 text-xl font-semibold text-[#d4af37]">
                        {detailStats.totalSpent.toFixed(2)}€
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Pedidos pendientes</p>
                      <p className="mt-1 text-xl font-semibold text-blue-400">{detailStats.pendingOrders}</p>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Rol</p>
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        {isProtectedAdminEmail(detailUser.email, adminEmail) ? (
                          <span className="text-sm text-[#d4af37]">Admin principal</span>
                        ) : (
                          <AdminSelect
                            value={detailUser.role}
                            onChange={(role) => handleRoleChange(detailUser.uid, role)}
                            options={ROLE_OPTIONS}
                            variant="status"
                            size="compact"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Pedidos recientes</p>
                      <Link
                        to={`/administrador/pedidos?email=${encodeURIComponent(detailUser.email)}`}
                        className="text-[0.65rem] uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8]"
                        onClick={closeDetail}
                      >
                        Ver todos →
                      </Link>
                    </div>
                    {detailUser.recentOrders.length === 0 ? (
                      <p className="rounded-xl border border-[#2a2520] bg-[#1e1b18] px-4 py-6 text-center text-sm text-[#a89a82]">
                        Sin pedidos todavía
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#2a2520] bg-[#141210] text-left text-[0.65rem] uppercase tracking-wider text-[#a89a82]">
                              <th className="px-3 py-2.5">Pedido</th>
                              <th className="px-3 py-2.5">Fecha</th>
                              <th className="px-3 py-2.5">Estado</th>
                              <th className="px-3 py-2.5 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2a2520]">
                            {detailUser.recentOrders.map((order) => (
                              <tr key={order.id}>
                                <td className="px-3 py-2.5 font-mono text-xs text-[#f5e6c8]">
                                  {order.id.slice(0, 8)}…
                                </td>
                                <td className="px-3 py-2.5 text-[#a89a82]">
                                  {formatDateTime(order.createdAt)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span
                                    className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-[#d4af37]">
                                  {(order.total ?? 0).toFixed(2)}€
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {copyMsg && (
                    <p className="text-center text-xs text-[#d4af37]" role="status">{copyMsg}</p>
                  )}
                </div>
                );
              })()}
            </div>

            <div className="shrink-0 border-t border-[#2a2520] px-6 py-4">
              <button
                type="button"
                onClick={closeDetail}
                className="w-full rounded-lg border border-[#2a2520] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#f5e6c8] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
