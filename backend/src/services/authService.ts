import { getAdminAuth, getAdminDb } from '../config/firebase.js';

export async function registerUser(
  uid: string,
  email: string,
  nombre: string,
  role = 'user'
) {
  const db = getAdminDb();
  const auth = getAdminAuth();

  const existing = await db.collection('users').doc(uid).get();
  if (existing.exists) {
    return existing.data() as { uid: string; email: string; nombre: string; role: string };
  }

  await db.collection('users').doc(uid).create({
    uid,
    email,
    nombre,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await auth.setCustomUserClaims(uid, { role });

  return { uid, email, nombre, role };
}

export async function getUserProfile(uid: string) {
  const db = getAdminDb();
  const doc = await db.collection('users').doc(uid).get();

  if (!doc.exists) return null;

  return doc.data();
}

export async function updateUserProfile(
  uid: string,
  data: { nombre?: string; phone?: string; address?: Record<string, string> }
) {
  const db = getAdminDb();
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (data.nombre !== undefined) update.nombre = data.nombre.trim();
  if (data.phone !== undefined) update.phone = data.phone.trim();
  if (data.address !== undefined) update.address = data.address;

  await db.collection('users').doc(uid).update(update);

  return getUserProfile(uid);
}

export async function getAllUsers() {
  const db = getAdminDb();
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map((doc) => doc.data());
}

interface RawOrder {
  userId?: string;
  total?: number;
  status?: string;
  createdAt?: string;
}

export interface UserOrderStats {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  pendingOrders: number;
}

function computeUserOrderStats(orders: RawOrder[]): UserOrderStats {
  let orderCount = 0;
  let totalSpent = 0;
  let lastOrderAt: string | null = null;
  let pendingOrders = 0;

  for (const order of orders) {
    const isCancelled = order.status === 'cancelado';

    if (!isCancelled) {
      orderCount += 1;
      totalSpent += order.total ?? 0;
      if (order.createdAt) {
        if (!lastOrderAt || order.createdAt > lastOrderAt) {
          lastOrderAt = order.createdAt;
        }
      }
    }

    if (order.status === 'pagado' || order.status === 'enviado') {
      pendingOrders += 1;
    }
  }

  return {
    orderCount,
    totalSpent,
    lastOrderAt,
    pendingOrders,
  };
}

function sortOrdersByCreatedAtDesc(orders: Array<RawOrder & { id?: string }>) {
  return [...orders].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export async function getAdminUsersWithStats() {
  const db = getAdminDb();
  const [usersSnap, ordersSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('orders').get(),
  ]);

  const ordersByUser = new Map<string, RawOrder[]>();
  for (const doc of ordersSnap.docs) {
    const data = doc.data() as RawOrder;
    const uid = data.userId;
    if (!uid) continue;
    const list = ordersByUser.get(uid) ?? [];
    list.push(data);
    ordersByUser.set(uid, list);
  }

  const users = usersSnap.docs.map((doc) => {
    const user = doc.data() as Record<string, unknown> & { uid?: string; createdAt?: string };
    const uid = (user.uid as string) || doc.id;
    const userOrders = ordersByUser.get(uid) ?? [];
    return {
      ...user,
      uid,
      stats: computeUserOrderStats(userOrders),
    };
  });

  users.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  return users;
}

export async function getAdminUserDetail(uid: string) {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;

  const user = userDoc.data()!;
  const ordersSnap = await db.collection('orders').where('userId', '==', uid).get();

  const allOrders = ordersSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RawOrder),
  }));

  const sorted = sortOrdersByCreatedAtDesc(allOrders);
  const recentOrders = sorted.slice(0, 5).map((order) => ({
    id: order.id!,
    total: order.total ?? 0,
    status: order.status ?? '',
    createdAt: order.createdAt ?? '',
  }));

  return {
    ...user,
    uid: (user.uid as string) || uid,
    stats: computeUserOrderStats(allOrders),
    recentOrders,
  };
}

export async function setUserRole(uid: string, role: string) {
  const db = getAdminDb();
  await db.collection('users').doc(uid).update({ role, updatedAt: new Date().toISOString() });

  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, { role });
}
