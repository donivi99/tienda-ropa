import { getAdminDb } from '../config/firebase.js';
import type { OrderInput, OrderStatus } from '../types/index.js';
import { SHIPPING_FEE } from '../types/index.js';
import { getCached, setCached, invalidateCachePrefix } from '../utils/cache.js';
import { resolveOrderItems, syncOrderItemsWithStock } from '../utils/orderItems.js';
import { StockInsufficientError } from '../utils/stripePayment.js';
import {
  getAdminAllowedStatuses,
  isAdminCancelWithStockRestore,
  isAdminOrderTransitionAllowed,
} from '../utils/adminOrderTransitions.js';
import type { RefundPendingReason, OrderItem, StockAdjustment } from '../types/index.js';

const DASHBOARD_CACHE_TTL_MS = 90_000;

const PAID_STATUSES: OrderStatus[] = ['pagado', 'enviado', 'entregado'];

export async function createOrder(
  userId: string,
  userEmail: string,
  userName: string,
  data: OrderInput,
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc();

  const items = await resolveOrderItems(data.items);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length > 0 ? SHIPPING_FEE : 0;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  await orderRef.set({
    userId,
    userEmail,
    userName,
    items,
    itemsAtCreation: items.map((item) => ({ ...item })),
    subtotal,
    shippingFee,
    total,
    status: 'pendiente_pago' satisfies OrderStatus,
    shippingAddress: data.shippingAddress,
    deliveryMethod: 'domicilio',
    paymentMethod: null,
    stripePaymentIntentId: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  invalidateCachePrefix('admin:');

  return { id: orderRef.id, subtotal, shippingFee, total, status: 'pendiente_pago' as const };
}

function orderItemsChanged(previous: OrderItem[], next: OrderItem[]): boolean {
  if (previous.length !== next.length) return true;

  return previous.some((item, index) => {
    const updated = next[index];
    return (
      item.productId !== updated.productId ||
      item.selectedSize !== updated.selectedSize ||
      item.selectedColor !== updated.selectedColor ||
      item.quantity !== updated.quantity ||
      item.price !== updated.price
    );
  });
}

/** Sincroniza stock/precios de un pedido pendiente antes de reanudar el pago. */
export async function preparePendingOrderPayment(orderId: string, userId: string) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new Error('Pedido no encontrado');
  }

  const data = snap.data();
  if (!data || data.userId !== userId) {
    throw new Error('Pedido no encontrado');
  }

  if (data.status !== 'pendiente_pago') {
    throw new Error('El pedido no está pendiente de pago');
  }

  const currentItems = (data.items ?? []) as OrderItem[];
  const storedBaseline = (data.itemsAtCreation ?? []) as OrderItem[];
  let baselineItems = storedBaseline.length > 0 ? storedBaseline : currentItems;

  if (storedBaseline.length === 0 && currentItems.length > 0) {
    await orderRef.update({
      itemsAtCreation: currentItems.map((item) => ({ ...item })),
      updatedAt: new Date().toISOString(),
    });
    baselineItems = currentItems;
  }

  if (baselineItems.length === 0) {
    throw new Error('El pedido no tiene productos');
  }

  const { items, adjustments } = await syncOrderItemsWithStock(baselineItems);
  const requestedTotal = baselineItems.reduce((sum, item) => sum + item.quantity, 0);
  const appliedTotal = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    throw new Error(
      'Ya no hay stock disponible para completar este pedido. Puedes cancelarlo desde Mis pedidos.',
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length > 0 ? SHIPPING_FEE : 0;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  const previousTotal = typeof data.total === 'number' ? data.total : 0;
  const previousPaymentIntentId =
    typeof data.stripePaymentIntentId === 'string' ? data.stripePaymentIntentId : null;
  const itemsChanged = orderItemsChanged(currentItems, items);
  const totalChanged = previousTotal !== total;
  const updatedAt = new Date().toISOString();

  if (itemsChanged || totalChanged) {
    const updatePayload: Record<string, unknown> = {
      items,
      subtotal,
      shippingFee,
      total,
      updatedAt,
    };

    if (totalChanged && previousPaymentIntentId) {
      updatePayload.stripePaymentIntentId = null;
    }

    await orderRef.update(updatePayload);
    invalidateCachePrefix('admin:');
  }

  return {
    order: {
      id: orderId,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      items,
      subtotal,
      shippingFee,
      total,
      status: 'pendiente_pago' as const,
      shippingAddress: data.shippingAddress,
      deliveryMethod: data.deliveryMethod,
      paymentMethod: data.paymentMethod ?? null,
      stripePaymentIntentId: totalChanged ? null : (previousPaymentIntentId ?? null),
      paidAt: data.paidAt ?? null,
      createdAt: data.createdAt,
      updatedAt,
    },
    adjustments: adjustments as StockAdjustment[],
    quantitySummary: {
      requestedTotal,
      appliedTotal,
    },
    totalChanged,
    previousPaymentIntentId: totalChanged ? previousPaymentIntentId : null,
  };
}

/** Marca el pedido como pagado y descuenta stock (idempotente). */
export async function fulfillPaidOrder(
  orderId: string,
  paymentIntentId: string,
  paymentMethod: 'stripe' = 'stripe',
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);

  const result = await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      throw new Error('Pedido no encontrado');
    }

    const order = orderSnap.data() as {
      status?: string;
      stripePaymentIntentId?: string | null;
      items?: Array<{
        productId: string;
        selectedSize: string;
        quantity: number;
        name?: string;
      }>;
    };

    if (order.status === 'pagado' && order.stripePaymentIntentId === paymentIntentId) {
      return { id: orderId, status: 'pagado' as const, alreadyFulfilled: true };
    }

    if (order.status !== 'pendiente_pago') {
      throw new Error('El pedido no está pendiente de pago');
    }

    const items = order.items ?? [];

    const checks = await Promise.all(
      items.map(async (item) => {
        const productRef = db.collection('products').doc(item.productId);
        const snap = await transaction.get(productRef);
        return { item, productRef, snap };
      }),
    );

    for (const { item, snap } of checks) {
      if (!snap.exists) {
        throw new Error(`Producto ${item.name ?? item.productId} no encontrado`);
      }
      const productData = snap.data() as { stock?: Record<string, number> } | undefined;
      const available = productData?.stock?.[item.selectedSize] ?? 0;
      if (available < item.quantity) {
        throw new StockInsufficientError(
          `Stock insuficiente para ${item.name ?? 'producto'} (talla ${item.selectedSize})`,
        );
      }
    }

    for (const { item, productRef, snap } of checks) {
      const productData = snap.data() as { stock?: Record<string, number> } | undefined;
      const available = productData?.stock?.[item.selectedSize] ?? 0;
      transaction.update(productRef, {
        [`stock.${item.selectedSize}`]: available - item.quantity,
      });
    }

    const paidAt = new Date().toISOString();
    transaction.update(orderRef, {
      status: 'pagado',
      paymentMethod,
      stripePaymentIntentId: paymentIntentId,
      paidAt,
      updatedAt: paidAt,
    });

    return { id: orderId, status: 'pagado' as const, alreadyFulfilled: false };
  });

  if (!result.alreadyFulfilled) {
    invalidateCachePrefix('admin:');
  }

  return result;
}

export async function setOrderPaymentIntentId(orderId: string, userId: string, paymentIntentId: string) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== userId || data.status !== 'pendiente_pago') {
    return null;
  }

  await orderRef.update({
    stripePaymentIntentId: paymentIntentId,
    updatedAt: new Date().toISOString(),
  });

  return { id: orderId, stripePaymentIntentId: paymentIntentId };
}

export async function markOrderPaymentFailed(orderId: string, paymentIntentId?: string) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.status !== 'pendiente_pago') return null;

  if (
    paymentIntentId &&
    data.stripePaymentIntentId &&
    data.stripePaymentIntentId !== paymentIntentId
  ) {
    return null;
  }

  await orderRef.update({
    status: 'pago_fallido',
    updatedAt: new Date().toISOString(),
  });

  return { id: orderId, status: 'pago_fallido' as const };
}

export async function markOrderRefunded(
  orderId: string,
  refundId: string,
  paymentIntentId: string,
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) return null;

  const data = snap.data();
  if (!data) return null;

  if (data.status === 'reembolsado') {
    return { id: orderId, status: 'reembolsado' as const };
  }

  if (data.status !== 'pendiente_pago' && data.status !== 'cancelado' && data.status !== 'reembolso_pendiente') {
    return null;
  }

  const refundedAt = new Date().toISOString();
  await orderRef.update({
    status: 'reembolsado',
    stripeRefundId: refundId,
    stripePaymentIntentId: paymentIntentId,
    refundedAt,
    refundPendingAt: null,
    refundPendingReason: null,
    refundLastError: null,
    updatedAt: refundedAt,
  });

  invalidateCachePrefix('admin:');

  return { id: orderId, status: 'reembolsado' as const };
}

export async function markOrderRefundPending(
  orderId: string,
  paymentIntentId: string,
  reason: RefundPendingReason,
  lastError?: string,
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) return null;

  const data = snap.data();
  if (!data) return null;

  if (data.status === 'reembolsado' || data.stripeRefundId) {
    return { id: orderId, status: 'reembolsado' as const };
  }

  const pendingStatuses = ['pendiente_pago', 'cancelado', 'reembolso_pendiente'];
  if (!pendingStatuses.includes(data.status as string)) {
    return null;
  }

  const refundPendingAt = new Date().toISOString();
  await orderRef.update({
    status: 'reembolso_pendiente',
    stripePaymentIntentId: paymentIntentId,
    refundPendingAt,
    refundPendingReason: reason,
    refundLastError: lastError?.slice(0, 500) ?? null,
    updatedAt: refundPendingAt,
  });

  invalidateCachePrefix('admin:');

  return { id: orderId, status: 'reembolso_pendiente' as const };
}

function sortOrdersByCreatedAtDesc<T extends { createdAt?: string }>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export async function getOrdersByUser(userId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection('orders').where('userId', '==', userId).get();

  const orders = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { createdAt?: string }),
  }));
  return sortOrdersByCreatedAtDesc(orders);
}

export async function getOrderById(orderId: string, userId?: string) {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc(orderId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  if (userId && data.userId !== userId) return null;
  return { id: doc.id, ...data };
}

export async function cancelOrder(orderId: string, userId: string) {
  const db = getAdminDb();
  const docRef = db.collection('orders').doc(orderId);

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) return null;

    const data = doc.data() as {
      userId?: string;
      status?: string;
      items?: Array<{ productId: string; selectedSize: string; quantity: number }>;
    } | undefined;

    if (!data || data.userId !== userId) return null;

    if (
      data.status === 'pendiente_pago' ||
      data.status === 'pago_fallido' ||
      data.status === 'reembolsado' ||
      data.status === 'reembolso_pendiente'
    ) {
      const previousStatus = data.status;
      transaction.update(docRef, {
        status: 'cancelado',
        updatedAt: new Date().toISOString(),
      });
      return { id: orderId, status: 'cancelado' as const, previousStatus };
    }

    if (data.status !== 'pagado') return null;

    const items = data.items ?? [];
    for (const item of items) {
      const productRef = db.collection('products').doc(item.productId);
      const snap = await transaction.get(productRef);
      if (snap.exists) {
        const productData = snap.data() as { stock?: Record<string, number> } | undefined;
        const available = productData?.stock?.[item.selectedSize] ?? 0;
        transaction.update(productRef, {
          [`stock.${item.selectedSize}`]: available + item.quantity,
        });
      }
    }

    transaction.update(docRef, {
      status: 'cancelado',
      updatedAt: new Date().toISOString(),
    });

    return { id: orderId, status: 'cancelado' as const, previousStatus: 'pagado' as const };
  });

  if (result) {
    invalidateCachePrefix('admin:');
  }

  return result;
}

export async function cancelOrderAsAdmin(orderId: string) {
  const db = getAdminDb();
  const docRef = db.collection('orders').doc(orderId);

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) return null;

    const data = doc.data() as {
      status?: string;
      items?: Array<{ productId: string; selectedSize: string; quantity: number }>;
    } | undefined;

    if (!data?.status) return null;

    const simpleCancelStatuses = [
      'pendiente_pago',
      'pago_fallido',
      'reembolsado',
      'reembolso_pendiente',
    ];

    if (simpleCancelStatuses.includes(data.status)) {
      const previousStatus = data.status;
      transaction.update(docRef, {
        status: 'cancelado',
        updatedAt: new Date().toISOString(),
      });
      return { id: orderId, status: 'cancelado' as const, previousStatus };
    }

    if (data.status === 'pagado' || data.status === 'enviado') {
      const items = data.items ?? [];
      for (const item of items) {
        const productRef = db.collection('products').doc(item.productId);
        const snap = await transaction.get(productRef);
        if (snap.exists) {
          const productData = snap.data() as { stock?: Record<string, number> } | undefined;
          const available = productData?.stock?.[item.selectedSize] ?? 0;
          transaction.update(productRef, {
            [`stock.${item.selectedSize}`]: available + item.quantity,
          });
        }
      }

      transaction.update(docRef, {
        status: 'cancelado',
        updatedAt: new Date().toISOString(),
      });

      return { id: orderId, status: 'cancelado' as const, previousStatus: data.status };
    }

    return null;
  });

  if (result) {
    invalidateCachePrefix('admin:');
  }

  return result;
}

export async function updateOrderStatusAsAdmin(orderId: string, newStatus: OrderStatus) {
  const existing = await getOrderById(orderId);
  if (!existing) return null;

  const currentStatus = (existing as { status?: string }).status;
  if (!isAdminOrderTransitionAllowed(currentStatus, newStatus)) {
    throw new Error(`Transición no permitida: ${currentStatus ?? 'desconocido'} → ${newStatus}`);
  }

  if (newStatus === 'cancelado') {
    return cancelOrderAsAdmin(orderId);
  }

  return updateOrderStatus(orderId, newStatus);
}

export { getAdminAllowedStatuses, isAdminCancelWithStockRestore };

export async function getAllOrders(options?: { limit?: number; cursor?: string }) {
  const db = getAdminDb();
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 200);

  let query: FirebaseFirestore.Query = db
    .collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (options?.cursor) {
    const cursorDoc = await db.collection('orders').doc(options.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return {
    orders,
    nextCursor: snapshot.docs.length === limit && lastDoc ? lastDoc.id : null,
    hasMore: snapshot.docs.length === limit,
  };
}

export async function getPendingRefundOrders() {
  const db = getAdminDb();
  const snapshot = await db.collection('orders').where('status', '==', 'reembolso_pendiente').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateOrderStatus(orderId: string, status: string) {
  const db = getAdminDb();
  const docRef = db.collection('orders').doc(orderId);
  const doc = await docRef.get();

  if (!doc.exists) return null;

  await docRef.update({
    status,
    updatedAt: new Date().toISOString(),
  });

  invalidateCachePrefix('admin:');

  return { id: orderId, status };
}

export async function getDashboardStats() {
  const cached = getCached<Awaited<ReturnType<typeof computeDashboardStats>>>('admin:dashboard');
  if (cached) return cached;

  const stats = await computeDashboardStats();
  setCached('admin:dashboard', stats, DASHBOARD_CACHE_TTL_MS);
  return stats;
}

async function computeDashboardStats() {
  const db = getAdminDb();

  const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('products').get(),
    db.collection('orders').get(),
  ]);

  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const totalRevenue = orders.reduce((sum, o) => {
    const status = (o as Record<string, unknown>).status as string | undefined;
    if (!status || !PAID_STATUSES.includes(status as OrderStatus)) return sum;
    return sum + ((o as Record<string, unknown>).total as number || 0);
  }, 0);

  const recentOrders = [...orders]
    .sort((a, b) => {
      const ta = new Date((a as Record<string, unknown>).createdAt as string || 0).getTime();
      const tb = new Date((b as Record<string, unknown>).createdAt as string || 0).getTime();
      return tb - ta;
    })
    .slice(0, 6);

  return {
    totalUsers: usersSnap.size,
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    recentOrders,
  };
}
