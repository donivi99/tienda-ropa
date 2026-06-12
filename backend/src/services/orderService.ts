import { getAdminDb } from '../config/firebase.js';
import type { OrderInput } from '../types/index.js';
import { SHIPPING_FEE } from '../types/index.js';

export async function createOrder(
  userId: string,
  userEmail: string,
  userName: string,
  data: OrderInput
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc();

  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = data.items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  await db.runTransaction(async (transaction) => {
    const checks = await Promise.all(
      data.items.map(async (item) => {
        const productRef = db.collection('products').doc(item.productId);
        const snap = await transaction.get(productRef);
        return { item, productRef, snap };
      })
    );

    for (const { item, snap } of checks) {
      if (!snap.exists) {
        throw new Error(`Producto ${item.name} no encontrado`);
      }
      const productData = snap.data() as { stock?: Record<string, number> } | undefined;
      const available = productData?.stock?.[item.selectedSize] ?? 0;
      if (available < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.name} (talla ${item.selectedSize})`);
      }
    }

    for (const { item, productRef, snap } of checks) {
      const productData = snap.data() as { stock?: Record<string, number> } | undefined;
      const available = productData?.stock?.[item.selectedSize] ?? 0;
      transaction.update(productRef, {
        [`stock.${item.selectedSize}`]: available - item.quantity,
      });
    }

    transaction.set(orderRef, {
      userId,
      userEmail,
      userName,
      items: data.items,
      subtotal,
      shippingFee,
      total,
      status: 'pagado',
      shippingAddress: data.shippingAddress,
      deliveryMethod: 'domicilio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return { id: orderRef.id, subtotal, shippingFee, total, status: 'pagado' };
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

    return { id: orderId, status: 'cancelado' as const };
  });

  return result;
}

export async function getAllOrders() {
  const db = getAdminDb();
  const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
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

  return { id: orderId, status };
}

export async function getDashboardStats() {
  const db = getAdminDb();

  const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('products').get(),
    db.collection('orders').get(),
  ]);

  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const totalRevenue = orders.reduce((sum, o) => sum + ((o as Record<string, unknown>).total as number || 0), 0);

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
