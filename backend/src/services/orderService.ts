import { getAdminDb } from '../config/firebase.js';
import type { OrderInput } from '../types/index.js';

export async function createOrder(
  userId: string,
  userEmail: string,
  userName: string,
  data: OrderInput
) {
  const db = getAdminDb();
  const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const docRef = await db.collection('orders').add({
    userId,
    userEmail,
    userName,
    items: data.items,
    total,
    status: 'pagado',
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { id: docRef.id, total, status: 'pagado' };
}

export async function getOrdersByUser(userId: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collection('orders')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  const doc = await docRef.get();

  if (!doc.exists) return null;

  const data = doc.data() as { userId?: string; status?: string } | undefined;
  if (!data || data.userId !== userId) return null;
  if (data.status !== 'pagado') return null;

  await docRef.update({
    status: 'cancelado',
    updatedAt: new Date().toISOString(),
  });

  return { id: orderId, status: 'cancelado' };
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

  const orders = ordersSnap.docs.map((d) => d.data());
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    totalUsers: usersSnap.size,
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    recentOrders: orders.slice(0, 5),
  };
}
