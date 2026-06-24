import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { ShippingAddress } from '../types';
import AddressDisplay from '../components/shipping/AddressDisplay';

interface OrderConfirmationState {
  orderId?: string;
  total?: number;
  shippingAddress?: ShippingAddress;
}

interface OrderResponse {
  id: string;
  status?: string;
  total?: number;
  subtotal?: number;
  shippingFee?: number;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string | null;
  stripePaymentIntentId?: string | null;
  paypalOrderId?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pago_fallido: 'Pago fallido',
  reembolsado: 'Reembolsado',
  reembolso_pendiente: 'Reembolso pendiente',
};

const PAID_STATUSES = new Set(['pagado', 'enviado', 'entregado']);
const TERMINAL_STATUSES = new Set([
  'pagado',
  'enviado',
  'entregado',
  'reembolsado',
  'reembolso_pendiente',
  'pago_fallido',
  'cancelado',
]);

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as OrderConfirmationState | null;
  const orderId = searchParams.get('orderId') || state?.orderId;
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;

    let active = true;
    let attempts = 0;
    const maxAttempts = 15;

    const tryConfirmPayment = async (orderData: OrderResponse) => {
      if (orderData.status && orderData.status !== 'pendiente_pago') {
        return;
      }

      const isPayPal =
        orderData.paymentMethod === 'paypal' || Boolean(orderData.paypalOrderId);
      const isStripe =
        orderData.paymentMethod === 'stripe' ||
        Boolean(orderData.stripePaymentIntentId) ||
        (!orderData.paymentMethod && !orderData.paypalOrderId);

      try {
        if (isPayPal) {
          await api.post('/api/payments/paypal/reconcile', { orderId });
        } else if (isStripe) {
          await api.post('/api/payments/stripe/confirm', { orderId });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        const benign =
          message.includes('Pago aún en proceso') ||
          message.includes('pagado') ||
          message.includes('reembolsado') ||
          message.includes('reembolso') ||
          message.includes('No hay pago');
        if (!benign && active) {
          setError(message || 'No se pudo confirmar el pago');
        }
      }
    };

    const load = async () => {
      try {
        setLoading(true);
        const data = await api.get<OrderResponse>(`/api/orders/${orderId}`);
        if (!active) return;

        await tryConfirmPayment(data);

        const refreshed = await api.get<OrderResponse>(`/api/orders/${orderId}`);
        if (!active) return;
        setOrder(refreshed);

        if (refreshed.status && !TERMINAL_STATUSES.has(refreshed.status) && attempts < maxAttempts) {
          attempts += 1;
          setTimeout(() => {
            if (active) void load();
          }, 2000);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#f5e6c8] mb-4">No hay confirmación disponible</h1>
        <p className="text-[#a89a82] mb-6">La página de confirmación solo está disponible justo después de completar un pedido.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#d4af37] text-[#0a0a0a] font-bold uppercase tracking-wider"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  const total = order?.total ?? state?.total ?? 0;
  const shippingAddress = order?.shippingAddress ?? state?.shippingAddress;
  const status = order?.status ?? 'pendiente_pago';
  const statusLabel = STATUS_LABELS[status] ?? status;
  const isPaid = PAID_STATUSES.has(status);
  const isRefunded = status === 'reembolsado';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[#141210] border border-[#2a2520] rounded-2xl p-8 md:p-10">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            isPaid ? 'bg-[#d4af37]/10' : isRefunded ? 'bg-[#b87a7a]/10' : 'bg-[#a89a82]/10'
          }`}
        >
          {isPaid ? (
            <svg className="w-8 h-8 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isRefunded ? (
            <svg className="w-8 h-8 text-[#d4a8a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-[#a89a82] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
          )}
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37] mb-2">
          {isPaid ? 'Pedido confirmado' : isRefunded ? 'Pedido reembolsado' : 'Procesando pago'}
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#f5e6c8] mb-4">
          {isPaid
            ? 'Tu pedido está en camino'
            : isRefunded
              ? 'No pudimos completar tu pedido'
              : 'Estamos confirmando tu pago'}
        </h1>
        <p className="text-[#a89a82] mb-8">
          {isPaid
            ? 'Hemos recibido tu compra y empezaremos a prepararla para envío a domicilio.'
            : isRefunded
              ? 'El producto se agotó durante el proceso de pago. Hemos procesado el reembolso automáticamente.'
              : 'Esto suele tardar unos segundos. No cierres esta página.'}
        </p>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a2520] bg-[#1e1b18] px-4 py-2 text-sm">
          <span className="text-[#a89a82]">Estado:</span>
          <span
            className={`font-semibold capitalize ${
              isPaid ? 'text-[#d4af37]' : isRefunded ? 'text-[#d4a8a8]' : 'text-[#a89a82]'
            }`}
          >
            {loading && !order ? 'Cargando...' : statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#1e1b18] border border-[#2a2520]">
            <p className="text-xs uppercase tracking-wider text-[#a89a82] mb-1">Número de pedido</p>
            <p className="text-[#f5e6c8] font-semibold break-all">#{orderId}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1e1b18] border border-[#2a2520]">
            <p className="text-xs uppercase tracking-wider text-[#a89a82] mb-1">
              Total {isPaid ? 'pagado' : isRefunded ? 'reembolsado' : 'a pagar'}
            </p>
            <p className="text-[#f5e6c8] font-semibold">€{total.toFixed(2)}</p>
          </div>
        </div>

        {shippingAddress && (
          <div className="p-4 rounded-xl bg-[#1e1b18] border border-[#2a2520] mb-8">
            <p className="text-xs uppercase tracking-wider text-[#a89a82] mb-3">Dirección de envío</p>
            <AddressDisplay address={shippingAddress} />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-6">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={orderId ? `/mi-cuenta/pedidos/${orderId}` : '/mi-cuenta/pedidos'}
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#d4af37] text-[#0a0a0a] font-bold uppercase tracking-wider"
          >
            Ver mis pedidos
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-[#2a2520] text-[#f5e6c8] font-bold uppercase tracking-wider hover:border-[#d4af37] transition-colors"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
