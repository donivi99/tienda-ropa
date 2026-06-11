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
  await db.collection('users').doc(uid).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  return getUserProfile(uid);
}

export async function getAllUsers() {
  const db = getAdminDb();
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map((doc) => doc.data());
}

export async function setUserRole(uid: string, role: string) {
  const db = getAdminDb();
  await db.collection('users').doc(uid).update({ role, updatedAt: new Date().toISOString() });

  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, { role });
}
