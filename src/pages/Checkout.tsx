import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SHIPPING_FEE, type CartItem, type ShippingAddress } from '../types';
import { api } from '../services/api';
import { PROFILE_ROUTES } from '../constants/profileRoutes';
import AddressFields from '../components/shipping/AddressFields';
import StripeCheckoutPayment from '../components/checkout/StripeCheckoutPayment';
import {
  EMPTY_SHIPPING_ADDRESS,
  isProfileShippingIncomplete,
  mergeShippingFromProfile,
  normalizeShippingAddress,
  profileToShippingAddress,
  shippingAddressToProfileUpdate,
  validateShippingAddress,
} from '../utils/shippingAddress';
import {
  hasStockQuantityChanges,
  type OrderQuantitySummary,
  type PreparePaymentResponse,
  type StockAdjustment,
} from '../utils/stockAdjustments';

function IncompleteProfileBanner() {
  return (
    <div className="rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#f5e6c8]">
      <p>Completa tus datos de envío en Mi Cuenta para agilizar futuras compras.</p>
      <Link
        to={PROFILE_ROUTES.data}
        className="mt-2 inline-block font-semibold text-[#d4af37] hover:text-[#f5e6c8] transition-colors"
      >
        Ir a Mis Datos →
      </Link>
    </div>
  );
}

interface CreatedOrder {
  id: string;
  total: number;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

function StockAdjustmentsBanner({
  adjustments,
  quantitySummary,
}: {
  adjustments: StockAdjustment[];
  quantitySummary?: OrderQuantitySummary;
}) {
  const hasQuantityChange = hasStockQuantityChanges(adjustments, quantitySummary);
  if (!hasQuantityChange) return null;

  return (
    <div
      className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#f5e6c8]"
      role="status"
    >
      <p className="font-semibold text-[#d4af37]">
        El stock ha cambiado desde que creaste este pedido.
      </p>
      {quantitySummary && quantitySummary.requestedTotal !== quantitySummary.appliedTotal && (
        <p className="mt-2 text-[#f5e6c8]">
          Vas a comprar{' '}
          <span className="font-semibold text-[#d4af37]">{quantitySummary.appliedTotal}</span>{' '}
          prenda(s) en lugar de las{' '}
          <span className="font-semibold text-[#d4af37]">{quantitySummary.requestedTotal}</span>{' '}
          que pediste.
        </p>
      )}
      {adjustments.length > 0 && (
        <ul className="mt-2 space-y-1 text-[#a89a82]">
          {adjustments.map((adjustment) => (
            <li key={`${adjustment.productId}-${adjustment.selectedSize}`}>
              {adjustment.appliedQuantity === 0 ? (
                <>
                  <span className="text-[#f5e6c8]">{adjustment.name}</span> (talla {adjustment.selectedSize}
                  ): pediste {adjustment.requestedQuantity}, pero ya no queda stock.
                </>
              ) : (
                <>
                  <span className="text-[#f5e6c8]">{adjustment.name}</span> (talla {adjustment.selectedSize}
                  ): pediste {adjustment.requestedQuantity}, ahora quedan {adjustment.availableQuantity}; hemos
                  actualizado tu pedido a {adjustment.appliedQuantity}.
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ResumeOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: ShippingAddress;
}

export default function Checkout() {
  const {
    items,
    subtotal,
    shippingFee,
    totalFinal,
    deliveryMethod,
    setDeliveryMethod,
    setShippingAddress,
    clearCart,
  } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeOrderId = searchParams.get('orderId')?.trim() || null;

  const [address, setAddress] = useState<ShippingAddress>(() =>
    profile ? profileToShippingAddress(profile) : { ...EMPTY_SHIPPING_ADDRESS },
  );
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(Boolean(resumeOrderId));
  const [error, setError] = useState('');
  const [step, setStep] = useState<'method' | 'address' | 'payment'>(
    resumeOrderId ? 'payment' : deliveryMethod ? 'address' : 'method',
  );
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [resumeOrder, setResumeOrder] = useState<ResumeOrder | null>(null);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [quantitySummary, setQuantitySummary] = useState<OrderQuantitySummary | undefined>();

  const profileIncomplete = isProfileShippingIncomplete(profile);
  const isResumeMode = Boolean(resumeOrderId);

  const applyPreparedPayment = (result: PreparePaymentResponse) => {
    setResumeOrder(result.order);
    setStockAdjustments(result.adjustments ?? []);
    setQuantitySummary(result.quantitySummary);
    setCreatedOrder({ id: result.order.id, total: result.order.total });
    setClientSecret(result.clientSecret);
    if (result.order.shippingAddress) {
      setAddress(result.order.shippingAddress);
    }
    setStep('payment');
  };

  useEffect(() => {
    if (!profile) return;
    setAddress((current) => mergeShippingFromProfile(current, profile));
  }, [profile]);

  useEffect(() => {
    if (!resumeOrderId) return;

    let cancelled = false;

    const prepareResumePayment = async () => {
      setResumeLoading(true);
      setError('');

      try {
        const result = await api.post<PreparePaymentResponse>(
          `/api/orders/${encodeURIComponent(resumeOrderId)}/prepare-payment`,
          {},
        );

        if (cancelled) return;

        applyPreparedPayment(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al preparar el pago del pedido');
          setStep('payment');
        }
      } finally {
        if (!cancelled) {
          setResumeLoading(false);
        }
      }
    };

    void prepareResumePayment();

    return () => {
      cancelled = true;
    };
  }, [resumeOrderId]);

  const handleSelectMethod = () => {
    setDeliveryMethod('domicilio');
    if (profile) {
      setAddress((current) => mergeShippingFromProfile(current, profile));
    }
    setStep('address');
  };

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!deliveryMethod) {
      setError('Selecciona un método de entrega');
      return;
    }

    const validationError = validateShippingAddress(address);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const fullAddress = normalizeShippingAddress(address);
    setShippingAddress(fullAddress);

    try {
      const order = await api.post<CreatedOrder & { total?: number }>('/api/orders', {
        userName: user?.displayName || fullAddress.nombre,
        items: items.map((item) => ({
          productId: item.productId,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        })),
        shippingAddress: fullAddress,
        deliveryMethod: 'domicilio',
      });

      const payment = await api.post<PaymentIntentResponse>('/api/payments/stripe/create-intent', {
        orderId: order.id,
      });

      setCreatedOrder({ id: order.id, total: order.total ?? totalFinal });
      setClientSecret(payment.clientSecret);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al preparar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!createdOrder) return;

    const fullAddress = normalizeShippingAddress(
      isResumeMode && resumeOrder?.shippingAddress ? resumeOrder.shippingAddress : address,
    );

    if (!isResumeMode) {
      try {
        await api.put('/api/auth/me', shippingAddressToProfileUpdate(fullAddress));
        await refreshProfile();
      } catch {
        // No bloquear confirmación si falla guardar perfil
      }
      clearCart();
    }

    navigate(`/pedido-confirmado?orderId=${createdOrder.id}`, {
      state: {
        orderId: createdOrder.id,
        total: createdOrder.total,
        shippingAddress: fullAddress,
      },
    });
  };

  const updateAddress = (patch: Partial<ShippingAddress>) => {
    setAddress((current) => ({ ...current, ...patch }));
  };

  const displayItems = isResumeMode && resumeOrder ? resumeOrder.items : items;
  const displaySubtotal =
    isResumeMode && resumeOrder ? resumeOrder.subtotal : subtotal;
  const displayShippingFee =
    isResumeMode && resumeOrder ? resumeOrder.shippingFee : deliveryMethod ? shippingFee : 0;
  const displayTotal =
    createdOrder?.total ??
    (isResumeMode && resumeOrder
      ? resumeOrder.total
      : deliveryMethod
        ? totalFinal
        : subtotal);

  if (!isResumeMode && items.length === 0 && step !== 'payment') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#f5e6c8]">Tu carrito está vacío</h2>
        <button onClick={() => navigate('/')} className="text-[#d4af37] underline">
          Volver al catálogo
        </button>
      </div>
    );
  }

  if (isResumeMode && resumeLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
        <p className="text-[#a89a82]">Preparando tu pago pendiente…</p>
      </div>
    );
  }

  const inputClass =
    'w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="font-heading text-2xl font-bold mb-6 text-[#f5e6c8] uppercase tracking-wider">
        {isResumeMode ? 'Completar pago' : 'Checkout'}
      </h2>

      {isResumeMode && (
        <p className="mb-4 text-sm text-[#a89a82]">
          Estás terminando un pedido pendiente de pago. Los importes se calculan en el servidor.
        </p>
      )}

      <StockAdjustmentsBanner adjustments={stockAdjustments} quantitySummary={quantitySummary} />

      <div className="space-y-3 mb-6 mt-4">
        {displayItems.map((item) => (
          <div
            key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
            className="flex justify-between text-sm"
          >
            <span className="text-[#a89a82]">
              {item.name} ({item.selectedSize}/{item.selectedColor}) x{item.quantity}
            </span>
            <span className="font-medium text-[#f5e6c8]">
              €{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-[#2a2520] pt-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#a89a82]">Subtotal</span>
          <span className="text-[#f5e6c8]">€{displaySubtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#a89a82]">Envío (España peninsular)</span>
          <span className="text-[#f5e6c8]">
            €{(isResumeMode || deliveryMethod ? displayShippingFee : 0).toFixed(2)}
          </span>
        </div>
        <div className="border-t border-[#2a2520] pt-2 flex justify-between font-bold text-lg">
          <span className="text-[#f5e6c8]">Total</span>
          <span className="text-[#d4af37]">€{displayTotal.toFixed(2)}</span>
        </div>
      </div>

      {!isResumeMode && step === 'method' && (
        <div className="space-y-4">
          {profileIncomplete && <IncompleteProfileBanner />}

          <h3 className="text-lg font-semibold text-[#f5e6c8]">Método de entrega</h3>
          <button
            type="button"
            onClick={handleSelectMethod}
            className="w-full border border-[#2a2520] bg-[#1e1b18] rounded-lg p-4 text-left hover:border-[#d4af37] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#f5e6c8]">Envío a domicilio</p>
                <p className="text-sm text-[#a89a82]">España peninsular · {SHIPPING_FEE.toFixed(2)}€</p>
              </div>
              <span className="text-[#d4af37] text-xl">→</span>
            </div>
          </button>
          <p className="text-xs text-[#a89a82]">Solo envíos dentro de España</p>
        </div>
      )}

      {!isResumeMode && step === 'address' && (
        <form onSubmit={handleContinueToPayment} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('method')}
            className="text-sm text-[#a89a82] hover:text-[#d4af37] transition-colors"
          >
            ← Cambiar método de entrega
          </button>

          {profileIncomplete && <IncompleteProfileBanner />}

          <p className="text-xs text-[#a89a82]">
            Los datos se rellenan desde{' '}
            <Link to={PROFILE_ROUTES.data} className="text-[#d4af37] hover:text-[#f5e6c8] transition-colors">
              Mis Datos
            </Link>
            {' '}y se guardarán al confirmar la compra.
          </p>

          <input
            type="text"
            placeholder="Nombre completo"
            required
            value={address.nombre}
            onChange={(e) => updateAddress({ nombre: e.target.value })}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            required
            value={address.telefono}
            onChange={(e) => updateAddress({ telefono: e.target.value })}
            className={inputClass}
          />

          <AddressFields
            idPrefix="checkout"
            value={address}
            onChange={updateAddress}
            inputClass={inputClass}
          />

          <p className="text-xs text-[#a89a82]">País: España (peninsular)</p>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] text-[#0a0a0a] py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider"
          >
            {loading ? 'Preparando pago...' : 'Continuar al pago'}
          </button>
        </form>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          {!isResumeMode && (
            <button
              type="button"
              onClick={() => setStep('address')}
              className="text-sm text-[#a89a82] hover:text-[#d4af37] transition-colors"
            >
              ← Volver a dirección de envío
            </button>
          )}

          {isResumeMode && (
            <Link
              to={PROFILE_ROUTES.orderDetail(resumeOrderId!)}
              className="text-sm text-[#a89a82] hover:text-[#d4af37] transition-colors"
            >
              ← Volver a Mis pedidos
            </Link>
          )}

          {error && !clientSecret && (
            <div className="space-y-3">
              <p className="text-red-400 text-sm">{error}</p>
              <Link
                to={PROFILE_ROUTES.orders}
                className="inline-block text-sm text-[#d4af37] hover:text-[#f5e6c8] transition-colors"
              >
                Ir a Mis pedidos
              </Link>
            </div>
          )}

          {createdOrder && clientSecret && (
            <>
              <h3 className="text-lg font-semibold text-[#f5e6c8]">Pago con tarjeta</h3>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <StripeCheckoutPayment
                clientSecret={clientSecret}
                orderId={createdOrder.id}
                onSuccess={handlePaymentSuccess}
                onError={setError}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
