import { getAdminAuth, getAdminDb } from '../config/firebase.js';

export async function registerUser(
  email: string,
  password: string,
  nombre: string
) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  const userRecord = await auth.createUser({ email, password, displayName: nombre });

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    nombre,
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { uid: userRecord.uid, email, nombre };
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
