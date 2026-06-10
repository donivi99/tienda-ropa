import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SHIPPING_FEE } from '../types';
import { api } from '../services/api';

const SPAIN_CP_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    nombre: profile?.nombre || '',
    telefono: profile?.phone || '',
    calle: (profile?.address as Record<string, string>)?.calle || '',
    ciudad: (profile?.address as Record<string, string>)?.ciudad || '',
    provincia: (profile?.address as Record<string, string>)?.provincia || '',
    codigoPostal: (profile?.address as Record<string, string>)?.codigoPostal || '',
    referencias: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'method' | 'address'>(deliveryMethod ? 'address' : 'method');

  useEffect(() => {
    if (!profile) return;

    setAddress((current) => ({
      nombre: current.nombre || profile.nombre || '',
      telefono: current.telefono || profile.phone || '',
      calle: current.calle || (profile.address as Record<string, string>)?.calle || '',
      ciudad: current.ciudad || (profile.address as Record<string, string>)?.ciudad || '',
      provincia: current.provincia || (profile.address as Record<string, string>)?.provincia || '',
      codigoPostal: current.codigoPostal || (profile.address as Record<string, string>)?.codigoPostal || '',
      referencias: current.referencias,
    }));
  }, [profile]);

  const handleSelectMethod = () => {
    setDeliveryMethod('domicilio');
    setStep('address');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!deliveryMethod) {
      setError('Selecciona un método de entrega');
      return;
    }

    if (!address.nombre.trim() || !address.telefono.trim()) {
      setError('Nombre y teléfono son obligatorios');
      return;
    }

    if (!SPAIN_CP_REGEX.test(address.codigoPostal)) {
      setError('Código postal español inválido (5 dígitos)');
      return;
    }

    setLoading(true);
    setError('');

    const fullAddress = {
      nombre: address.nombre.trim(),
      telefono: address.telefono.trim(),
      calle: address.calle.trim(),
      ciudad: address.ciudad.trim(),
      provincia: address.provincia.trim(),
      codigoPostal: address.codigoPostal.trim(),
      referencias: address.referencias.trim() || undefined,
    };

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

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#f5e6c8]">Tu carrito está vacío</h2>
        <button onClick={() => navigate('/')} className="text-[#d4af37] underline">Volver al catálogo</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>Checkout</h2>

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
          <h3 className="text-lg font-semibold text-[#f5e6c8]">Método de entrega</h3>
          <button
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

          <input
            type="text"
            placeholder="Nombre completo"
            required
            value={address.nombre}
            onChange={(e) => setAddress({ ...address, nombre: e.target.value })}
            className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            required
            value={address.telefono}
            onChange={(e) => setAddress({ ...address, telefono: e.target.value })}
            className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Calle y número"
            required
            value={address.calle}
            onChange={(e) => setAddress({ ...address, calle: e.target.value })}
            className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Ciudad"
              required
              value={address.ciudad}
              onChange={(e) => setAddress({ ...address, ciudad: e.target.value })}
              className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Provincia"
              required
              value={address.provincia}
              onChange={(e) => setAddress({ ...address, provincia: e.target.value })}
              className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
          <input
            type="text"
            placeholder="Código postal (5 dígitos)"
            required
            value={address.codigoPostal}
            onChange={(e) => setAddress({ ...address, codigoPostal: e.target.value })}
            className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Referencias (opcional: piso, puerta...)"
            value={address.referencias}
            onChange={(e) => setAddress({ ...address, referencias: e.target.value })}
            className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
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
