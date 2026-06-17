import { getAdminDb } from '../config/firebase.js';
import { getEffectivePrice } from './pricing.js';
import type { OrderItem } from '../types/index.js';

export interface OrderItemInput {
  productId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export async function resolveOrderItems(items: OrderItemInput[]): Promise<OrderItem[]> {
  const db = getAdminDb();
  const resolved: OrderItem[] = [];

  for (const item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 99) {
      throw new Error('Ítem de pedido inválido');
    }

    const snap = await db.collection('products').doc(item.productId).get();
    if (!snap.exists) {
      throw new Error('Producto no encontrado');
    }

    const product = snap.data() as {
      name?: string;
      price?: number;
      discountPercent?: number;
      images?: string[];
      sizes?: string[];
      colors?: string[];
      stock?: Record<string, number>;
      isActive?: boolean;
    };

    if (product.isActive === false) {
      throw new Error('Producto no disponible');
    }

    if (typeof product.price !== 'number' || product.price <= 0) {
      throw new Error('Precio de producto inválido');
    }

    if (!product.sizes?.includes(item.selectedSize)) {
      throw new Error(`Talla no válida para ${product.name ?? 'producto'}`);
    }

    const colorMatch = product.colors?.some(
      (c) => c.toLowerCase() === item.selectedColor.toLowerCase(),
    );
    if (!colorMatch) {
      throw new Error(`Color no válido para ${product.name ?? 'producto'}`);
    }

    const available = product.stock?.[item.selectedSize] ?? 0;
    if (available < item.quantity) {
      throw new Error(
        `Stock insuficiente para ${product.name ?? 'producto'} (talla ${item.selectedSize})`,
      );
    }

    resolved.push({
      productId: item.productId,
      name: product.name ?? 'Producto',
      price: getEffectivePrice(product.price, product.discountPercent),
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      quantity: item.quantity,
      image: product.images?.[0] ?? '',
    });
  }

  return resolved;
}
