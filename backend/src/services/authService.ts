import { getAdminAuth, getAdminDb } from '../config/firebase.js';
import { isProtectedAdminEmail } from '../constants/admin.js';
import { getCached, setCached } from '../utils/cache.js';

const ORDERS_CACHE_TTL_MS = 60_000;

export async function ensureUserProfile(uid: string, email: string) {
  const existing = await getUserProfile(uid);
  if (existing) return existing;

  const defaultRole = isProtectedAdminEmail(email) ? 'admin' : 'user';
  const db = getAdminDb();
  const auth = getAdminAuth();

  await db.collection('users').doc(uid).create({
    uid,
    email,
    nombre: email.split('@')[0],
    role: defaultRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await auth.setCustomUserClaims(uid, { role: defaultRole });

  return getUserProfile(uid);
}

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

export async function getAdminUsersWithStats(options?: { limit?: number; cursor?: string }) {
  const db = getAdminDb();
  const ordersByUser = await getOrdersByUserMap();

  if (!options?.limit && !options?.cursor) {
    const usersSnap = await db.collection('users').get();
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

    return { users, nextCursor: null, hasMore: false };
  }

  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  let usersQuery: FirebaseFirestore.Query = db.collection('users').limit(limit);

  if (options?.cursor) {
    const cursorDoc = await db.collection('users').doc(options.cursor).get();
    if (cursorDoc.exists) {
      usersQuery = usersQuery.startAfter(cursorDoc);
    }
  }

  const usersSnap = await usersQuery.get();
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

  const lastDoc = usersSnap.docs[usersSnap.docs.length - 1];

  return {
    users,
    nextCursor: usersSnap.docs.length === limit && lastDoc ? lastDoc.id : null,
    hasMore: usersSnap.docs.length === limit,
  };
}

async function getOrdersByUserMap(): Promise<Map<string, RawOrder[]>> {
  const cached = getCached<Map<string, RawOrder[]>>('admin:orders-by-user');
  if (cached) return cached;

  const db = getAdminDb();
  const ordersSnap = await db.collection('orders').get();
  const ordersByUser = new Map<string, RawOrder[]>();

  for (const doc of ordersSnap.docs) {
    const data = doc.data() as RawOrder;
    const uid = data.userId;
    if (!uid) continue;
    const list = ordersByUser.get(uid) ?? [];
    list.push(data);
    ordersByUser.set(uid, list);
  }

  setCached('admin:orders-by-user', ordersByUser, ORDERS_CACHE_TTL_MS);
  return ordersByUser;
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
