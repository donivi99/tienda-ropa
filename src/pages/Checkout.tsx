import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({ calle: '', ciudad: '', codigoPostal: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const db = getFirebaseDb();

      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error(`Producto ${item.name} no encontrado`);
          }

          const stock = productSnap.data().stock;
          const available = stock[item.selectedSize] ?? 0;

          if (available < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.name} (talla ${item.selectedSize})`);
          }

          transaction.update(productRef, {
            [`stock.${item.selectedSize}`]: available - item.quantity,
          });
        }

        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, {
          userId: user?.uid ?? 'guest',
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            price: item.price,
          })),
          totalAmount,
          shippingAddress: address,
          status: 'pagado',
          createdAt: serverTimestamp(),
        });
      });

      clearCart();
      navigate('/mi-cuenta');
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
            <span className="font-medium text-[#f5e6c8]">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-[#2a2520] pt-3 flex justify-between font-bold text-lg">
          <span className="text-[#f5e6c8]">Total</span>
          <span className="text-[#d4af37]">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Calle y número"
          required
          value={address.calle}
          onChange={(e) => setAddress({ ...address, calle: e.target.value })}
          className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
        />
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
          placeholder="Código postal"
          required
          value={address.codigoPostal}
          onChange={(e) => setAddress({ ...address, codigoPostal: e.target.value })}
          className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#d4af37] text-[#0a0a0a] py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider"
        >
          {loading ? 'Procesando...' : 'Comprar'}
        </button>
      </form>
    </div>
  );
}
