import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, subtotal, shippingFee, totalFinal, deliveryMethod, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#141210] z-50 shadow-2xl flex flex-col border-l border-[#2a2520]">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2520]">
          <h2 className="text-lg font-semibold text-[#f5e6c8] uppercase tracking-wider">Carrito ({items.length})</h2>
          <button onClick={onClose} className="p-1 text-[#a89a82] hover:text-[#d4af37] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-[#a89a82] py-8">Tu carrito está vacío</p>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3 border-b border-[#2a2520] pb-4">
                <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#f5e6c8]">{item.name}</h3>
                  <p className="text-xs text-[#a89a82]">{item.selectedSize} / {item.selectedColor}</p>
                  <p className="text-sm font-bold mt-1 text-[#d4af37]">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity - 1)}
                      className="w-6 h-6 border border-[#2a2520] rounded text-sm flex items-center justify-center text-[#f5e6c8] hover:border-[#d4af37] transition-colors"
                    >
                      -
                    </button>
                    <span className="text-sm text-[#f5e6c8]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                      className="w-6 h-6 border border-[#2a2520] rounded text-sm flex items-center justify-center text-[#f5e6c8] hover:border-[#d4af37] transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productId, item.selectedSize, item.selectedColor)}
                      className="ml-auto text-xs text-[#a89a82] hover:text-red-400 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#2a2520] p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#a89a82]">Subtotal</span>
                <span className="text-[#f5e6c8]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a89a82]">Envío</span>
                <span className="text-[#f5e6c8]">${deliveryMethod ? shippingFee.toFixed(2) : '-'}</span>
              </div>
            </div>
            <div className="border-t border-[#2a2520] pt-2 flex justify-between text-lg font-bold">
              <span className="text-[#f5e6c8]">Total</span>
              <span className="text-[#d4af37]">${deliveryMethod ? totalFinal.toFixed(2) : subtotal.toFixed(2)}</span>
            </div>
            <Link
              to={user ? '/finalizar-compra' : '/iniciar-sesion'}
              onClick={onClose}
              className="block w-full bg-[#d4af37] text-[#0a0a0a] text-center py-3 rounded-lg font-bold hover:bg-[#b8962e] transition-colors uppercase tracking-wider"
            >
              Tramitar Pedido
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
