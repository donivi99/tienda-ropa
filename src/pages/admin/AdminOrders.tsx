import { useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminSelect, ORDER_STATUS_TONES, orderStatusOptions } from '../../components/admin/AdminSelect';
import { api } from '../../services/api';
import type { CartItem, ShippingAddress } from '../../types';

type OrderStatus = 'pagado' | 'enviado' | 'entregado' | 'cancelado';
type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortKey = 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'status';

interface AdminOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  subtotal?: number;
  shippingFee?: number;
  total: number;
  shippingAddress: ShippingAddress;
  deliveryMethod?: 'domicilio';
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pagado', label: 'Pagado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_SORT_ORDER: Record<OrderStatus, number> = {
  pagado: 0,
  enviado: 1,
  entregado: 2,
  cancelado: 3,
};

const STALE_PAGADO_DAYS = 3;

const STATUS_SELECT_OPTIONS = orderStatusOptions(STATUS_OPTIONS);
const STATUS_FILTER_OPTIONS = orderStatusOptions(STATUS_OPTIONS, { label: 'Todos' });

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Últimos 7 días' },
  { value: 'month', label: 'Últimos 30 días' },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Fecha (más recientes)' },
  { value: 'date-asc', label: 'Fecha (más antiguos)' },
  { value: 'total-desc', label: 'Total (mayor)' },
  { value: 'total-asc', label: 'Total (menor)' },
  { value: 'status', label: 'Estado' },
];

function statusBadgeClass(status: string) {
  return ORDER_STATUS_TONES[status] ?? 'border-[#2a2520] bg-[#1e1b18] text-[#a89a82]';
}

function statusLabel(status: OrderStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
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

function formatAddress(addr: ShippingAddress) {
  const lines = [
    `${addr.nombre} · ${addr.telefono}`,
    addr.calle,
    `${addr.codigoPostal} ${addr.ciudad}, ${addr.provincia}`,
  ];
  if (addr.referencias?.trim()) lines.push(addr.referencias.trim());
  return lines.join('\n');
}

function isStalePagado(order: AdminOrder) {
  if (order.status !== 'pagado') return false;
  const created = new Date(order.createdAt).getTime();
  const cutoff = Date.now() - STALE_PAGADO_DAYS * 24 * 60 * 60 * 1000;
  return created < cutoff;
}

function matchesDateFilter(createdAt: string, filter: DateFilter) {
  if (filter === 'all') return true;
  const created = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') return created >= startOfToday;

  const days = filter === 'week' ? 7 : 30;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return created >= cutoff;
}

type OptimisticAction = { type: 'status'; id: string; status: OrderStatus };

function applyOptimistic(orders: AdminOrder[], action: OptimisticAction): AdminOrder[] {
  if (action.type === 'status') {
    return orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o));
  }
  return orders;
}

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterDate, setFilterDate] = useState<DateFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [optimisticOrders, dispatchOptimistic] = useOptimistic(orders, applyOptimistic);
  const [, startTransition] = useTransition();

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.get<AdminOrder[]>('/api/admin/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const email = searchParams.get('email');
    const q = searchParams.get('q');
    if (email) setSearchQuery(email);
    else if (q) setSearchQuery(q);
  }, [searchParams]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || filterStatus !== '' || filterDate !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterDate('all');
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = optimisticOrders.filter((order) => {
      if (filterStatus && order.status !== filterStatus) return false;
      if (!matchesDateFilter(order.createdAt, filterDate)) return false;
      if (q) {
        const inId = order.id.toLowerCase().includes(q);
        const inEmail = order.userEmail?.toLowerCase().includes(q);
        const inName = order.userName?.toLowerCase().includes(q);
        const inShipName = order.shippingAddress?.nombre?.toLowerCase().includes(q);
        if (!inId && !inEmail && !inName && !inShipName) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total-desc':
          return (b.total ?? 0) - (a.total ?? 0);
        case 'total-asc':
          return (a.total ?? 0) - (b.total ?? 0);
        case 'status':
          return STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
        case 'date-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [optimisticOrders, searchQuery, filterStatus, filterDate, sortKey]);

  const summary = useMemo(() => {
    const pendingShip = filteredOrders.filter((o) => o.status === 'pagado').length;
    const stalePending = filteredOrders.filter(isStalePagado).length;
    const revenue = filteredOrders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);
    return { pendingShip, stalePending, revenue };
  }, [filteredOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const previous = orders.find((o) => o.id === orderId)?.status;

    startTransition(() => {
      dispatchOptimistic({ type: 'status', id: orderId, status });
    });

    try {
      await api.put(`/api/admin/orders/${orderId}`, { status });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
        )
      );
      if (detailOrder?.id === orderId) {
        setDetailOrder((prev) =>
          prev ? { ...prev, status, updatedAt: new Date().toISOString() } : prev
        );
      }
      showToast(`Estado actualizado: ${statusLabel(status)}`);
    } catch (err) {
      console.error(err);
      if (previous) {
        startTransition(() => {
          dispatchOptimistic({ type: 'status', id: orderId, status: previous });
        });
      }
      showToast('Error al guardar el estado', 'error');
    }
  };

  const openDetail = async (orderId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setCopyMsg('');
    setDetailOrder(null);

    try {
      const data = await api.get<AdminOrder>(`/api/admin/orders/${orderId}`);
      setDetailOrder(data);
    } catch {
      setDetailError('No se pudo cargar el detalle del pedido');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailOrder(null);
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

  const copyAddress = async () => {
    if (!detailOrder?.shippingAddress) return;
    try {
      await navigator.clipboard.writeText(formatAddress(detailOrder.shippingAddress));
      setCopyMsg('Dirección copiada');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('No se pudo copiar');
    }
  };

  const copyOrderId = async () => {
    if (!detailOrder) return;
    try {
      await navigator.clipboard.writeText(detailOrder.id);
      setCopyMsg('ID copiado');
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

  const subtotal = detailOrder?.subtotal ?? detailOrder?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const shippingFee = detailOrder?.shippingFee ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-[#d4af37]/40 bg-[#141210] text-[#f5e6c8]'
              : 'border-red-500/40 bg-[#141210] text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-[#a89a82]">
          {filteredOrders.length === orders.length
            ? `${orders.length} pedidos`
            : `${filteredOrders.length} de ${orders.length} pedidos`}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">Pendientes de envío</p>
          <p className="mt-1 text-2xl font-semibold text-[#d4af37]">{summary.pendingShip}</p>
        </div>
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">
            Pagados +{STALE_PAGADO_DAYS}d sin enviar
          </p>
          <p className={`mt-1 text-2xl font-semibold ${summary.stalePending > 0 ? 'text-red-400' : 'text-[#f5e6c8]'}`}>
            {summary.stalePending}
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2520] bg-[#141210] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">Ingresos (filtro actual)</p>
          <p className="mt-1 text-2xl font-semibold text-[#d4af37]">{summary.revenue.toFixed(2)}€</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#2a2520] bg-[#141210] p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="order-search" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
              Buscar
            </label>
            <input
              id="order-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ID, email o nombre del cliente..."
              className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-sm text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
          <AdminSelect
            id="filter-status"
            label="Estado"
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as OrderStatus | '')}
            options={STATUS_FILTER_OPTIONS}
            variant="status"
          />
          <AdminSelect
            id="filter-date"
            label="Fecha"
            value={filterDate}
            onChange={(v) => setFilterDate(v as DateFilter)}
            options={DATE_FILTER_OPTIONS}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <AdminSelect
            id="sort-key"
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

      <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2520] bg-[#141210]">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Pedido</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Cliente</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Productos</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Total</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Estado</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Fecha</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#a89a82]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2520]">
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#a89a82]">
                  {orders.length === 0 ? 'No hay pedidos todavía' : 'Ningún pedido coincide con los filtros'}
                </td>
              </tr>
            )}
            {filteredOrders.map((order) => {
              const stale = isStalePagado(order);
              return (
                <tr
                  key={order.id}
                  onClick={() => openDetail(order.id)}
                  className={`cursor-pointer transition-colors hover:bg-[#141210]/50 ${
                    stale ? 'bg-red-500/5 border-l-2 border-l-red-500/50' : ''
                  } ${order.status === 'cancelado' ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#f5e6c8]">
                    <span title={order.id}>{order.id.slice(0, 8)}…</span>
                    {stale && (
                      <span className="ml-2 inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-red-400">
                        Urgente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[#f5e6c8]">{order.userName || 'Sin nombre'}</p>
                    <p className="text-xs text-[#a89a82]">{order.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">{order.items?.length || 0} productos</td>
                  <td className="px-4 py-3 font-semibold text-[#d4af37]">{order.total?.toFixed(2)}€</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-lg border px-3 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#a89a82]">
                    <span className="block">{formatDateTime(order.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(order.id);
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs text-[#a89a82] transition-colors hover:bg-[#2a2520] hover:text-[#f5e6c8]"
                    >
                      Ver detalle
                    </button>
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
          aria-labelledby="order-detail-title"
          onClick={closeDetail}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#2a2520] bg-[#141210] shadow-[0_24px_80px_rgba(0,0,0,0.5)] outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#2a2520] px-6 py-5">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[#d4af37]">Detalle del pedido</p>
                <h2 id="order-detail-title" className="mt-1 text-xl font-semibold text-[#f5e6c8]">
                  {detailOrder ? `Pedido #${detailOrder.id.slice(0, 8)}…` : detailLoading ? 'Cargando…' : 'Error'}
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

              {detailOrder && !detailLoading && (
                <div className="space-y-6">
                  {(detailOrder.status === 'pagado' || detailOrder.status === 'enviado') && (
                    <div className="flex flex-wrap gap-2">
                      {detailOrder.status === 'pagado' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(detailOrder.id, 'enviado')}
                          className="rounded-lg bg-blue-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-400 transition-colors hover:bg-blue-500/30"
                        >
                          Marcar como enviado
                        </button>
                      )}
                      {detailOrder.status === 'enviado' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(detailOrder.id, 'entregado')}
                          className="rounded-lg bg-green-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-green-400 transition-colors hover:bg-green-500/30"
                        >
                          Marcar como entregado
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">ID completo</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="break-all font-mono text-xs text-[#f5e6c8]">{detailOrder.id}</p>
                        <button
                          type="button"
                          onClick={copyOrderId}
                          className="shrink-0 text-[0.65rem] uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8]"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <AdminSelect
                        id="detail-order-status"
                        label="Estado"
                        value={detailOrder.status}
                        onChange={(v) => handleStatusChange(detailOrder.id, v as OrderStatus)}
                        options={STATUS_SELECT_OPTIONS}
                        variant="status"
                      />
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Creado</p>
                      <p className="mt-1 text-sm text-[#f5e6c8]">{formatDateTime(detailOrder.createdAt)}</p>
                    </div>
                    {detailOrder.updatedAt && (
                      <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Última actualización</p>
                        <p className="mt-1 text-sm text-[#f5e6c8]">{formatDateTime(detailOrder.updatedAt)}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                    <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Cliente</p>
                    <p className="mt-2 text-[#f5e6c8] font-medium">{detailOrder.userName || detailOrder.shippingAddress?.nombre || 'Sin nombre'}</p>
                    <p className="text-sm text-[#a89a82]">{detailOrder.userEmail}</p>
                    {detailOrder.shippingAddress?.telefono && (
                      <p className="mt-1 text-sm text-[#a89a82]">Tel: {detailOrder.shippingAddress.telefono}</p>
                    )}
                  </div>

                  {detailOrder.shippingAddress && (
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Dirección de envío</p>
                        <button
                          type="button"
                          onClick={copyAddress}
                          className="text-[0.65rem] uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8]"
                        >
                          Copiar dirección
                        </button>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-[#f5e6c8]">
                        <p>{detailOrder.shippingAddress.nombre}</p>
                        <p>{detailOrder.shippingAddress.calle}</p>
                        <p>
                          {detailOrder.shippingAddress.codigoPostal}{' '}
                          {detailOrder.shippingAddress.ciudad}, {detailOrder.shippingAddress.provincia}
                        </p>
                        {detailOrder.shippingAddress.referencias && (
                          <p className="text-[#a89a82]">Ref: {detailOrder.shippingAddress.referencias}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-3 text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Productos</p>
                    <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2520] bg-[#141210] text-left text-[0.65rem] uppercase tracking-wider text-[#a89a82]">
                            <th className="px-3 py-2.5">Producto</th>
                            <th className="px-3 py-2.5">Talla</th>
                            <th className="px-3 py-2.5">Color</th>
                            <th className="px-3 py-2.5 text-center">Cant.</th>
                            <th className="px-3 py-2.5 text-right">P. unit.</th>
                            <th className="px-3 py-2.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2520]">
                          {detailOrder.items.map((item, idx) => (
                            <tr key={`${item.productId}-${idx}`}>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt=""
                                      loading="lazy"
                                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-[#f5e6c8]">{item.name}</p>
                                    <Link
                                      to="/administrador/productos"
                                      onClick={(e) => e.stopPropagation()}
                                      className="truncate font-mono text-[0.6rem] text-[#d4af37] hover:text-[#f5e6c8]"
                                      title={`Ver en catálogo: ${item.productId}`}
                                    >
                                      {item.productId}
                                    </Link>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[#a89a82]">{item.selectedSize}</td>
                              <td className="px-3 py-3 capitalize text-[#a89a82]">{item.selectedColor}</td>
                              <td className="px-3 py-3 text-center text-[#f5e6c8]">{item.quantity}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-[#a89a82]">{item.price.toFixed(2)}€</td>
                              <td className="px-3 py-3 text-right tabular-nums font-medium text-[#d4af37]">
                                {(item.price * item.quantity).toFixed(2)}€
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-[#a89a82]">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{subtotal.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-[#a89a82]">
                        <span>Envío</span>
                        <span className="tabular-nums">{shippingFee.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between border-t border-[#2a2520] pt-2 text-base font-semibold text-[#f5e6c8]">
                        <span>Total</span>
                        <span className="tabular-nums text-[#d4af37]">{detailOrder.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  {copyMsg && (
                    <p className="text-center text-xs text-[#d4af37]" role="status">{copyMsg}</p>
                  )}
                </div>
              )}
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
