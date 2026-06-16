import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SHIPPING_FEE, type ShippingAddress } from '../types';
import { api } from '../services/api';
import { PROFILE_ROUTES } from '../constants/profileRoutes';
import AddressFields from '../components/shipping/AddressFields';
import {
  EMPTY_SHIPPING_ADDRESS,
  isProfileShippingIncomplete,
  mergeShippingFromProfile,
  normalizeShippingAddress,
  profileToShippingAddress,
  shippingAddressToProfileUpdate,
  validateShippingAddress,
} from '../utils/shippingAddress';

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

  const [address, setAddress] = useState<ShippingAddress>(() =>
    profile ? profileToShippingAddress(profile) : { ...EMPTY_SHIPPING_ADDRESS },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'method' | 'address'>(deliveryMethod ? 'address' : 'method');

  const profileIncomplete = isProfileShippingIncomplete(profile);

  useEffect(() => {
    if (!profile) return;
    setAddress((current) => mergeShippingFromProfile(current, profile));
  }, [profile]);

  const handleSelectMethod = () => {
    setDeliveryMethod('domicilio');
    if (profile) {
      setAddress((current) => mergeShippingFromProfile(current, profile));
    }
    setStep('address');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const order = await api.post<{ id: string }>('/api/orders', {
        userName: user?.displayName || fullAddress.nombre,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          price: item.price,
          image: item.image,
        })),
        subtotal,
        shippingFee,
        totalAmount: totalFinal,
        shippingAddress: fullAddress,
        deliveryMethod: 'domicilio',
      });

      try {
        await api.put('/api/auth/me', shippingAddressToProfileUpdate(fullAddress));
        await refreshProfile();
      } catch {
        // El pedido ya se creó; no bloquear la confirmación si falla guardar el perfil
      }

      clearCart();
      navigate(`/pedido-confirmado?orderId=${order.id}`, {
        state: {
          orderId: order.id,
          total: totalFinal,
          shippingAddress: fullAddress,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = (patch: Partial<ShippingAddress>) => {
    setAddress((current) => ({ ...current, ...patch }));
  };

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#f5e6c8]">Tu carrito está vacío</h2>
        <button onClick={() => navigate('/')} className="text-[#d4af37] underline">Volver al catálogo</button>
      </div>
    );
  }

  const inputClass =
    'w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="font-heading text-2xl font-bold mb-6 text-[#f5e6c8] uppercase tracking-wider">Checkout</h2>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between text-sm">
            <span className="text-[#a89a82]">
              {item.name} ({item.selectedSize}/{item.selectedColor}) x{item.quantity}
            </span>
            <span className="font-medium text-[#f5e6c8]">€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[#2a2520] pt-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#a89a82]">Subtotal</span>
          <span className="text-[#f5e6c8]">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#a89a82]">Envío (España peninsular)</span>
          <span className="text-[#f5e6c8]">€{deliveryMethod ? shippingFee.toFixed(2) : '-'}</span>
        </div>
        <div className="border-t border-[#2a2520] pt-2 flex justify-between font-bold text-lg">
          <span className="text-[#f5e6c8]">Total</span>
          <span className="text-[#d4af37]">€{deliveryMethod ? totalFinal.toFixed(2) : subtotal.toFixed(2)}</span>
        </div>
      </div>

      {step === 'method' && (
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

      {step === 'address' && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Procesando...' : 'Comprar'}
          </button>
        </form>
      )}
    </div>
  );
}
