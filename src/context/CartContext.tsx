import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; selectedSize: string; selectedColor: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; selectedSize: string; selectedColor: string; quantity: number } }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, selectedSize: string, selectedColor: string) => void;
  updateQuantity: (productId: string, selectedSize: string, selectedColor: string, quantity: number) => void;
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

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (productId: string, selectedSize: string, selectedColor: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, selectedSize, selectedColor } });
  };

  const updateQuantity = (productId: string, selectedSize: string, selectedColor: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, selectedSize, selectedColor, quantity } });
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
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
