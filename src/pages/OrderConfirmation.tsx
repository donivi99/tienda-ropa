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
}

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

    const load = async () => {
      try {
        setLoading(true);
        const data = await api.get<OrderResponse>(`/api/orders/${orderId}`);
        if (active) setOrder(data);
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
  const statusLabel = order?.status ?? 'pagado';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[#141210] border border-[#2a2520] rounded-2xl p-8 md:p-10">
        <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37] mb-2">Pedido confirmado</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#f5e6c8] mb-4">
          Tu pedido está en camino
        </h1>
        <p className="text-[#a89a82] mb-8">
          Hemos recibido tu compra y empezaremos a prepararla para envío a domicilio.
        </p>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a2520] bg-[#1e1b18] px-4 py-2 text-sm">
          <span className="text-[#a89a82]">Estado:</span>
          <span className="font-semibold text-[#d4af37] capitalize">{loading ? 'Cargando...' : statusLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#1e1b18] border border-[#2a2520]">
            <p className="text-xs uppercase tracking-wider text-[#a89a82] mb-1">Número de pedido</p>
            <p className="text-[#f5e6c8] font-semibold break-all">#{orderId}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1e1b18] border border-[#2a2520]">
            <p className="text-xs uppercase tracking-wider text-[#a89a82] mb-1">Total pagado</p>
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
