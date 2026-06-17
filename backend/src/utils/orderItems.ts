import { getAdminDb } from '../config/firebase.js';
import { getEffectivePrice } from './pricing.js';
import type { OrderItem } from '../types/index.js';

export interface OrderItemInput {
  productId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface StockAdjustment {
  productId: string;
  name: string;
  selectedSize: string;
  requestedQuantity: number;
  availableQuantity: number;
  appliedQuantity: number;
}

export interface StockSyncProduct {
  name?: string;
  price?: number;
  discountPercent?: number;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  stock?: Record<string, number>;
  isActive?: boolean;
}

export function computeAppliedQuantity(requestedQuantity: number, availableQuantity: number): number {
  if (requestedQuantity < 1) return 0;
  return Math.max(0, Math.min(requestedQuantity, Math.max(0, availableQuantity)));
}

export function syncSingleOrderItemWithStock(
  item: OrderItem,
  product: StockSyncProduct | null | undefined,
): { item: OrderItem | null; adjustment: StockAdjustment | null } {
  if (!product) {
    throw new Error(`Producto ${item.name ?? item.productId} no encontrado`);
  }

  if (product.isActive === false) {
    throw new Error(`Producto ${product.name ?? item.name ?? 'producto'} no disponible`);
  }

  if (typeof product.price !== 'number' || product.price <= 0) {
    throw new Error(`Precio de producto inválido para ${product.name ?? item.name ?? 'producto'}`);
  }

  if (!product.sizes?.includes(item.selectedSize)) {
    throw new Error(`Talla no válida para ${product.name ?? item.name ?? 'producto'}`);
  }

  const colorMatch = product.colors?.some(
    (color) => color.toLowerCase() === item.selectedColor.toLowerCase(),
  );
  if (!colorMatch) {
    throw new Error(`Color no válido para ${product.name ?? item.name ?? 'producto'}`);
  }

  const available = product.stock?.[item.selectedSize] ?? 0;
  const appliedQuantity = computeAppliedQuantity(item.quantity, available);
  const name = product.name ?? item.name ?? 'Producto';

  if (appliedQuantity === 0) {
    return {
      item: null,
      adjustment: {
        productId: item.productId,
        name,
        selectedSize: item.selectedSize,
        requestedQuantity: item.quantity,
        availableQuantity: available,
        appliedQuantity: 0,
      },
    };
  }

  const resolvedItem: OrderItem = {
    productId: item.productId,
    name,
    price: getEffectivePrice(product.price, product.discountPercent),
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
    quantity: appliedQuantity,
    image: product.images?.[0] ?? item.image ?? '',
  };

  const adjustment =
    appliedQuantity !== item.quantity
      ? {
          productId: item.productId,
          name,
          selectedSize: item.selectedSize,
          requestedQuantity: item.quantity,
          availableQuantity: available,
          appliedQuantity,
        }
      : null;

  return { item: resolvedItem, adjustment };
}

export async function syncOrderItemsWithStock(items: OrderItem[]): Promise<{
  items: OrderItem[];
  adjustments: StockAdjustment[];
}> {
  const db = getAdminDb();
  const resolved: OrderItem[] = [];
  const adjustments: StockAdjustment[] = [];

  for (const item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 99) {
      throw new Error('Ítem de pedido inválido');
    }

    const snap = await db.collection('products').doc(item.productId).get();
    const { item: syncedItem, adjustment } = syncSingleOrderItemWithStock(
      item,
      snap.exists ? (snap.data() as StockSyncProduct) : null,
    );

    if (adjustment) {
      adjustments.push(adjustment);
    }

    if (syncedItem) {
      resolved.push(syncedItem);
    }
  }

  return { items: resolved, adjustments };
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
