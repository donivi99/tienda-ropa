import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { CartItem, ShippingAddress } from '../types';
import { SHIPPING_FEE } from '../types';

interface CartState {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  deliveryMethod: 'domicilio' | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; selectedSize: string; selectedColor: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; selectedSize: string; selectedColor: string; quantity: number } }
  | { type: 'SET_DELIVERY_METHOD'; payload: 'domicilio' }
  | { type: 'SET_SHIPPING_ADDRESS'; payload: ShippingAddress }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  totalFinal: number;
  deliveryMethod: 'domicilio' | null;
  shippingAddress: ShippingAddress | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, selectedSize: string, selectedColor: string) => void;
  updateQuantity: (productId: string, selectedSize: string, selectedColor: string, quantity: number) => void;
  setDeliveryMethod: (method: 'domicilio') => void;
  setShippingAddress: (address: ShippingAddress) => void;
  clearCart: () => void;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { quantity = 1, ...newItem } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.selectedSize === newItem.selectedSize &&
          item.selectedColor === newItem.selectedColor
      );

      if (existingIndex >= 0) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return { ...state, items: updated };
      }

      return { ...state, items: [...state.items, { ...newItem, quantity }] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.productId === action.payload.productId &&
              item.selectedSize === action.payload.selectedSize &&
              item.selectedColor === action.payload.selectedColor
            )
        ),
      };

    case 'UPDATE_QUANTITY': {
      const { quantity, ...coords } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) =>
              !(
                item.productId === coords.productId &&
                item.selectedSize === coords.selectedSize &&
                item.selectedColor === coords.selectedColor
              )
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === coords.productId &&
          item.selectedSize === coords.selectedSize &&
          item.selectedColor === coords.selectedColor
            ? { ...item, quantity }
            : item
        ),
      };
    }

    case 'SET_DELIVERY_METHOD':
      return { ...state, deliveryMethod: action.payload };

    case 'SET_SHIPPING_ADDRESS':
      return { ...state, shippingAddress: action.payload };

    case 'CLEAR_CART':
      return { items: [], shippingAddress: null, deliveryMethod: null };

    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    shippingAddress: null,
    deliveryMethod: null,
  });

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (productId: string, selectedSize: string, selectedColor: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, selectedSize, selectedColor } });
  };

  const updateQuantity = (productId: string, selectedSize: string, selectedColor: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, selectedSize, selectedColor, quantity } });
  };

  const setDeliveryMethod = (method: 'domicilio') => {
    dispatch({ type: 'SET_DELIVERY_METHOD', payload: method });
  };

  const setShippingAddress = (address: ShippingAddress) => {
    dispatch({ type: 'SET_SHIPPING_ADDRESS', payload: address });
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = state.deliveryMethod === 'domicilio' && state.items.length > 0 ? SHIPPING_FEE : 0;
  const totalFinal = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        subtotal,
        shippingFee,
        totalFinal,
        deliveryMethod: state.deliveryMethod,
        shippingAddress: state.shippingAddress,
        addItem,
        removeItem,
        updateQuantity,
        setDeliveryMethod,
        setShippingAddress,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
