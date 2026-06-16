import { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PROFILE_ROUTES } from '../../constants/profileRoutes';
import { api } from '../../services/api';
import type { CartItem, ShippingAddress } from '../../types';
import { formatDateTime, formatEuro, shortOrderId, statusBadgeClass, statusLabel } from '../../utils/orderUi';
import AddressDisplay from '../shipping/AddressDisplay';

type OrderStatus = 'pagado' | 'enviado' | 'entregado' | 'cancelado';

export interface UserOrder {
  id: string;
  items: CartItem[];
  subtotal?: number;
  shippingFee?: number;
  total: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

type OptimisticAction = { type: 'cancel'; id: string };

function applyOptimistic(orders: UserOrder[], action: OptimisticAction): UserOrder[] {
  if (action.type === 'cancel') {
    return orders.map((o) => (o.id === action.id ? { ...o, status: 'cancelado' } : o));
  }
  return orders;
}

interface ProfileOrdersTabProps {
  orders: UserOrder[];
  ordersLoading: boolean;
  ordersError: string | null;
  onOrdersChange: (orders: UserOrder[]) => void;
}

export default function ProfileOrdersTab({
  orders,
  ordersLoading,
  ordersError,
  onOrdersChange,
}: ProfileOrdersTabProps) {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const [optimisticOrders, dispatchOptimistic] = useOptimistic(orders, applyOptimistic);
  const [, startTransition] = useTransition();
  const [detailOrder, setDetailOrder] = useState<UserOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState('');

  const openDetail = useCallback(async (orderId: string) => {
    setDetailError('');
    setDetailLoading(true);
    setDetailOrder(null);

    const cached = orders.find((o) => o.id === orderId);
    if (cached?.items?.length) {
      setDetailOrder(cached);
      setDetailLoading(false);
      return;
    }

    try {
      const data = await api.get<UserOrder>(`/api/orders/${orderId}`);
      setDetailOrder(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Error al cargar el pedido');
    } finally {
      setDetailLoading(false);
    }
  }, [orders]);

  useEffect(() => {
    if (orderId) {
      void openDetail(orderId);
    } else {
      setDetailOrder(null);
      setDetailError('');
      setCancelError('');
    }
  }, [orderId, openDetail]);

  const closeDetail = () => {
    navigate(PROFILE_ROUTES.orders);
  };

  const openOrderDetail = (id: string) => {
    navigate(PROFILE_ROUTES.orderDetail(id));
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido?')) return;

    setCancellingId(orderId);
    setCancelError('');
    const previous = orders.find((o) => o.id === orderId)?.status;

    startTransition(() => {
      dispatchOptimistic({ type: 'cancel', id: orderId });
    });

    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      const updated = orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelado' as OrderStatus } : o));
      onOrdersChange(updated);
      if (detailOrder?.id === orderId) {
        setDetailOrder({ ...detailOrder, status: 'cancelado' });
      }
    } catch (err) {
      if (previous) {
        onOrdersChange(orders.map((o) => (o.id === orderId ? { ...o, status: previous } : o)));
      }
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar el pedido');
    } finally {
      setCancellingId(null);
    }
  };

  const displayOrders = optimisticOrders;

  return (
    <div className="space-y-6" role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider">
          Mis Pedidos
        </h1>
        <p className="text-[#a89a82] text-sm mt-1">Historial de tus compras</p>
      </div>

      {ordersError && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {ordersError}
        </div>
      )}

      <div className="bg-[#141210] border border-[#2a2520] rounded-xl overflow-hidden">
        {ordersLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e1b18] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#a89a82]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#f5e6c8] mb-2">
              Sin pedidos aún
            </h3>
            <p className="text-sm text-[#a89a82] max-w-sm mx-auto mb-6">
              Realiza tu primera compra y tus pedidos aparecerán aquí.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#d4af37] text-[#0a0a0a] font-bold uppercase tracking-wider text-sm hover:bg-[#b8962e] transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2520] bg-[#1a1714] text-left text-[0.65rem] uppercase tracking-wider text-[#a89a82]">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2520]">
                {displayOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer hover:bg-[#1e1b18]/60 transition-colors"
                    onClick={() => openOrderDetail(order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-[#f5e6c8]">{shortOrderId(order.id)}</td>
                    <td className="px-4 py-3 text-[#a89a82]">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${statusBadgeClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-[#d4af37]">
                      {formatEuro(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(detailOrder || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={closeDetail}>
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#2a2520] bg-[#141210] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#2a2520] px-6 py-4">
              <h2 id="order-detail-title" className="font-heading text-lg font-bold text-[#f5e6c8]">
                Detalle del pedido
              </h2>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">ID</p>
                      <p className="mt-1 break-all font-mono text-xs text-[#f5e6c8]">{detailOrder.id}</p>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Estado</p>
                      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${statusBadgeClass(detailOrder.status)}`}>
                        {statusLabel(detailOrder.status)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Creado</p>
                      <p className="mt-1 text-sm text-[#f5e6c8]">{formatDateTime(detailOrder.createdAt)}</p>
                    </div>
                    {detailOrder.updatedAt && (
                      <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Actualizado</p>
                        <p className="mt-1 text-sm text-[#f5e6c8]">{formatDateTime(detailOrder.updatedAt)}</p>
                      </div>
                    )}
                  </div>

                  {detailOrder.shippingAddress && (
                    <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                      <p className="text-[0.65rem] uppercase tracking-wider text-[#a89a82]">Dirección de envío</p>
                      <div className="mt-3">
                        <AddressDisplay address={detailOrder.shippingAddress} />
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
                            <th className="px-3 py-2.5 text-center">Cant.</th>
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
                                      referrerPolicy="no-referrer"
                                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                    />
                                  )}
                                  <p className="font-medium text-[#f5e6c8]">{item.name}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[#a89a82]">{item.selectedSize}</td>
                              <td className="px-3 py-3 text-center text-[#f5e6c8]">{item.quantity}</td>
                              <td className="px-3 py-3 text-right tabular-nums font-medium text-[#d4af37]">
                                {formatEuro(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2a2520] bg-[#1e1b18] p-4">
                    <div className="space-y-2 text-sm">
                      {detailOrder.subtotal != null && (
                        <div className="flex justify-between text-[#a89a82]">
                          <span>Subtotal</span>
                          <span className="tabular-nums">{formatEuro(detailOrder.subtotal)}</span>
                        </div>
                      )}
                      {detailOrder.shippingFee != null && (
                        <div className="flex justify-between text-[#a89a82]">
                          <span>Envío</span>
                          <span className="tabular-nums">{formatEuro(detailOrder.shippingFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-[#2a2520] pt-2 text-base font-semibold text-[#f5e6c8]">
                        <span>Total</span>
                        <span className="tabular-nums text-[#d4af37]">{formatEuro(detailOrder.total)}</span>
                      </div>
                    </div>
                  </div>

                  {detailOrder.status === 'pagado' && (
                    <button
                      type="button"
                      disabled={cancellingId === detailOrder.id}
                      onClick={() => void handleCancel(detailOrder.id)}
                      className="w-full rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-red-300 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {cancellingId === detailOrder.id ? 'Cancelando…' : 'Cancelar pedido'}
                    </button>
                  )}

                  {cancelError && (
                    <p className="text-center text-sm text-red-400" role="status">{cancelError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#2a2520] px-6 py-4">
              <button
                type="button"
                onClick={closeDetail}
                className="w-full rounded-lg border border-[#2a2520] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[#f5e6c8] transition-colors hover:border-[#d4af37]"
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
